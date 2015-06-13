var http = require('http')
var corsify = require('corsify')
var collect = require('stream-collector')
var pump = require('pump')
var iterate = require('random-iterate')
var limiter = require('size-limit-stream')
var eos = require('end-of-stream')
var nstatic = require('node-static');

module.exports = function(opts) {
  var channels = {}
  var maxBroadcasts = (opts && opts.maxBroadcasts) || Infinity

  var get = function(channel) {
    if (channels[channel]) return channels[channel]
    channels[channel] = {
      name: channel,
      subscribers: []
    }
    return channels[channel]
  }

  var cors = corsify({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    "Access-Control-Allow-Headers": "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization"
  });

  var file = new nstatic.Server('./../');

  var server = http.createServer(cors(function(req, res) {

    if (req.url === '/signaling') {
      res.end(JSON.stringify({
        name: 'signalhub',
        version: require('../package').version
      }, null, 2) + '\n')
      return
    }

    if (req.url.slice(0, 4) !== '/signaling/v1/') {
      res.statusCode = 404
      res.end()
      return
    }

    var name = req.url.slice(4).split('?')[0]

    if (req.method === 'POST' && req.url === '/signaling') {
      collect(pump(req, limiter(64 * 1024)), function(err, data) {
        if (err) return res.end()
        if (!channels[name]) return res.end()
        var channel = get(name)

        server.emit('publish', channel.name, data)
        data = Buffer.concat(data).toString()

        var ite = iterate(channel.subscribers)
        var next
        var cnt = 0

        while ((next = ite()) && cnt++ < maxBroadcasts) {
          next.write('data: ' + data + '\n\n')
        }

        res.end()
      })
      return
    }

    if (req.method === 'GET' && req.url === '/signaling') {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')

      var app = name.split('/')[0]
      var channelNames = name.slice(app.length + 1)

      channelNames.split(',').forEach(function(channelName) {
        var channel = get(app + '/' + channelName)
        server.emit('subscribe', channel.name)
        channel.subscribers.push(res)
        eos(res, function() {
          var i = channel.subscribers.indexOf(res)
          if (i > -1) channel.subscribers.splice(i, 1)
          if (!channel.subscribers.length && channel === channels[channel.name]) delete channels[channel.name]
        })
      })

      if (res.flushHeaders) res.flushHeaders()

      return
    }

    console.log('here');

    file.serve(req, res);

    // req.addListener('end', function() {
    //   //
    //   // Serve files!
    //   //

    // }).resume();

    // res.statusCode = 404
    // res.end()
  }))

  return server
}