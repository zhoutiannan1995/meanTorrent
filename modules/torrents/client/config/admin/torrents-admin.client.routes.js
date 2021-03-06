(function () {
  'use strict';

  // Setting up route
  angular
    .module('torrents.admin.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('admin.torrents', {
        url: '/torrents',
        templateUrl: '/modules/torrents/client/views/admin/admin-list.client.view.html',
        data: {
          pageTitle: 'PAGETITLE.ADMIN_TORRENTS_LIST'
        }
      });
  }
}());
