import angular from 'angular';

angular
  .module('drsApp')
  .factory('GamertagListService', GamertagListService);

GamertagListService.$inject = ['$q', 'BungieLookupService', 'PlatformService', 'RaidService', 'UtilsService'];

function GamertagListService($q, BungieLookupService, PlatformService, RaidService, UtilsService) {
  const service = {
    addGamertag: addGamertag,
    gamertags: []
    // removeGamertag: removeGamertag
  };
  return service;

  function addGamertag(gamertag, platform) {
    const p = $q.defer();

    gamertag = UtilsService.sanitizeInput(gamertag);
    if (UtilsService.isUndefinedOrNullOrEmpty(gamertag)) {
      p.reject("Gamertag input is invalid");
      return p.promise;
    }

    const entry = { gamertag: gamertag, platform: platform, loading: true, error: false };
    service.gamertags.push(entry);

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
      // http://destinystatus.com/psn/<gamertag>
      // http://destinystatus.com/xbl/<gamertag>
      // TODO: don't set these in code
      return "<a href='http://destinystatus.com/" +
        (entry.platform === PlatformService.platforms[0] ? "psn" : "xbl") + "/" + entry.gamertag +
        "' target='_blank' alt='View gamertag on Destiny Status'>DS</a>";
    }
    function buildDestinyTrackerUrl() {
      // http://destinytracker.com/destiny/overview/ps/<gamertag>
      // http://destinytracker.com/destiny/overview/xbox/<gamertag>
      // TODO: don't set these in code
      return "<a href='http://destinytracker.com/destiny/overview/" +
        (entry.platform === PlatformService.platforms[0] ? "ps" : "xbox") + "/" + entry.gamertag +
        "' target='_blank' alt='View gamertag on Destiny Tracker'>DTR</a>";
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
      stats.nm = entry.stats[RaidService.raids[i++]] || 0;
      stats.hm = entry.stats[RaidService.raids[i++]] || 0;
      // non-featured + featured. They have different hashes.
      stats[390] = (entry.stats[RaidService.raids[i++]] || 0) + (entry.stats[RaidService.raids[i++]] || 0);
      stats.total = stats.nm + stats.hm + stats[390];
      return stats;
    }

    entry.ce = buildStats(0);
    entry.vog = buildStats(4);
    entry.kf = buildStats(8);
    entry.wotm = buildStats(12);
  }

  // function removeGamertag(gamertag, platform) {
    // console.log("[drs] todo");
  // }
}