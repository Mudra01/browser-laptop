/* global describe, before, after, it */
const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')

require('../braveUnit')

describe('siteHacks unit tests', function () {
  let siteHacks
  let siteHacksData
  let beforeSendCB
  // let beforeRequestCB
  let urlParse
  let filtering
  const fakeElectron = require('../lib/fakeElectron')
  const fakeAdBlock = require('../lib/fakeAdBlock')
  const fakeFiltering = {
    getMainFrameUrl: (details) => {
      return filtering.getMainFrameUrl(details)
    },
    isResourceEnabled: (resourceName, url, isPrivate) => {
      return true
    },
    registerBeforeSendHeadersFilteringCB: (cb) => {
      beforeSendCB = cb
    },
    registerBeforeRequestFilteringCB: (cb) => {
      // beforeRequestCB = cb
    }
  }

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    urlParse = require('../../../app/common/urlParse')
    mockery.registerMock('./common/urlParse', urlParse)
    filtering = require('../../../app/filtering')
    mockery.registerMock('./filtering', fakeFiltering)
    siteHacksData = require('../../../js/data/siteHacks')
    mockery.registerMock('../js/data/siteHacks', siteHacksData)

    siteHacks = require('../../../app/siteHacks')
  })

  after(function () {
    mockery.disable()
  })

  describe('init', function () {
    let beforeSendSpy
    let beforeRequestSpy

    before(function () {
      beforeSendSpy = sinon.spy(fakeFiltering, 'registerBeforeSendHeadersFilteringCB')
      beforeRequestSpy = sinon.spy(fakeFiltering, 'registerBeforeRequestFilteringCB')
      siteHacks.init()
    })
    after(function () {
      beforeSendSpy.restore()
      beforeRequestSpy.restore()
    })

    it('calls Filtering.registerBeforeSendHeadersFilteringCB', function () {
      assert.equal(beforeSendSpy.calledOnce, true)
    })

    describe('in the callback passed into registerBeforeSendHeadersFilteringCB', function () {
      let getMainFrameUrlSpy
      let onBeforeSendHeadersSpy
      // let result
      const details = {
        resourceType: 'mainFrame',
        requestHeaders: {
          'User-Agent': 'Brave Chrome/60.0.3112.101'
        },
        url: 'https://subdomain.adobe.com',
        tabId: 1
      }
      before(function () {
        getMainFrameUrlSpy = sinon.spy(fakeFiltering, 'getMainFrameUrl')
        onBeforeSendHeadersSpy = sinon.spy(siteHacksData.siteHacks['adobe.com'], 'onBeforeSendHeaders')

        if (typeof beforeSendCB === 'function') {
          // result = beforeSendCB(details)
          beforeSendCB(details)
        }
      })
      after(function () {
        getMainFrameUrlSpy.restore()
        onBeforeSendHeadersSpy.restore()
      })

      it('calls Filtering.getMainFrameUrl', function () {
        assert.equal(getMainFrameUrlSpy.calledOnce, true)
      })

      describe('when site hack is found for domain', function () {
        it('calls hack.onBeforeSendHeaders', function () {
          assert.equal(onBeforeSendHeadersSpy.calledOnce, true)
        })
      })
    })

    it('calls Filtering.registerBeforeRequestFilteringCB', function () {
      assert.equal(beforeRequestSpy.calledOnce, true)
    })

    // describe('in the callback passed into registerBeforeRequestFilteringCB', function () {
    //   let result
    //   before(function () {
    //     if (typeof beforeRequestCB === 'function') {
    //       result = beforeRequestCB()
    //     }
    //   })
    // })
  })
})
