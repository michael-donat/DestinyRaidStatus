import angular from 'angular';

angular
  .module('drsApp')
  .factory('PlayerListService', PlayerListService);

PlayerListService.$inject = ['$q', '$translate', 'BungieLookupService', 'Constants', 'UtilsService'];

function PlayerListService($q, $translate, BungieLookupService, Constants, UtilsService) {
  const service = {
    addPlayer: addPlayer,
    players: []
    // removePlayer: removePlayer
  };
  return service;

  function addPlayer(player, platform) {
    const p = $q.defer();

    player = UtilsService.sanitizeInput(player);
    if (UtilsService.isUndefinedOrNullOrEmpty(player)) {
      p.reject("Gamertag or PSN Id input is invalid");
      return p.promise;
    }

    platform = UtilsService.sanitizeInput(platform);
    if (UtilsService.isUndefinedOrNullOrEmpty(platform)) {
      p.reject("Platform is invalid");
      return p.promise;
    }

    const entry = { player: player, platform: platform, loading: true, error: false };
    service.players.push(entry);

    // do the async stuff
    BungieLookupService.lookup(entry)
      .then(function success(response) {
        entry.stats = response;
        buildLinks(entry);
        parseStats(entry);
        entry.loading = false;
      }, function failure(response) {
        entry.errorString = response;
        entry.error = true;
        entry.loading = false;
      });

    p.resolve();

    return p.promise;
  }

  function buildLinks(entry) {
    function buildDestinyStatusUrl() {
      // http://destinystatus.com/psn/<player>
      // http://destinystatus.com/xbl/<player>
      const alt = $translate.instant('Links.DestinyStatus.Alt');
      const text = $translate.instant('Links.DestinyStatus.Text');
      return "<a href='http://destinystatus.com/" +
        (entry.platform === Constants.platforms[0] ? "psn" : "xbl") + "/" + entry.player +
        "' target='_blank' alt='" + alt + "'>" + text + "</a>";
    }
    function buildDestinyTrackerUrl() {
      // http://destinytracker.com/destiny/overview/ps/<player>
      // http://destinytracker.com/destiny/overview/xbox/<player>
      const alt = $translate.instant('Links.DestinyTracker.Alt');
      const text = $translate.instant('Links.DestinyTracker.Text');
      return "<a href='http://destinytracker.com/destiny/overview/" +
        (entry.platform === Constants.platforms[0] ? "ps" : "xbox") + "/" + entry.player +
        "' target='_blank' alt='" + alt + "'>" + text + "</a>";
    }

    const urls = {};
    urls.destinyStatus = buildDestinyStatusUrl();
    urls.destinyTracker = buildDestinyTrackerUrl();
    entry.urls = urls;
  }

  function parseStats(entry) {
    function buildStats(start) {
      const stats = {};
      let i = start;
      stats.nm = entry.stats[Constants.raids[i++]] || 0;
      stats.hm = entry.stats[Constants.raids[i++]] || 0;
      // non-featured + featured. They have different hashes.
      stats[390] = (entry.stats[Constants.raids[i++]] || 0) + (entry.stats[Constants.raids[i++]] || 0);
      stats.total = stats.nm + stats.hm + stats[390];
      return stats;
    }

    entry.ce = buildStats(0);
    entry.vog = buildStats(4);
    entry.kf = buildStats(8);
    entry.wotm = buildStats(12);
  }

  // function removePlayer(player, platform) {
    // console.log("[drs] todo");
  // }
}