import $ from 'jquery';
import _ from 'lodash'
import * as THREE from 'three';
import Vue from 'vue'

window.$ = $;

import OrbitControls from './orbit';
import Planet from './Planet';
import Starfield from './Starfield';
import UI from './UI';
import Helpers from './Helpers';

const CAMERATYPE = 'persp'; // or 'ortho'
var timerCounter = 0;


class Plotfields {
  constructor() {
    this._setupScene();
    this._setupLights();

    var group = new THREE.Group();

    this.scene.add(group)
    this.plotfields = group;

    this.planetGroup = new THREE.Group();
    this.planetGroup.name = "planetGroup";
		this.plotfields.add(this.planetGroup);

    this.planets = {};

    this.planetFocusID = null;
    this.lastFewPlanets = [];
    this.lastFewPlanetN = 5;

    this.populate();

    this.UI = new UI({
        renderer: this.renderer,
        scene: this.scene,
        camera: this.camera,
        plotfields: this
    });
    console.log("CALL");
    // var axesHelper = new THREE.AxesHelper( 5 );
    // this.scene.add( axesHelper );
  }


  addPlanet(planetattr) {
    var planet = new Planet(planetattr);
    this.planets[planet.id] = planet;
    planet.addToScene(this.planetGroup);
    this.planetFocusID = planet.id

    // last few planets is a queue
    this.lastFewPlanets.push(planet.id);
    if(this.lastFewPlanets.length > this.lastFewPlanetN) { this.lastFewPlanets.shift(); }
  }

  populate() {

    this.starfield = new Starfield({
      count: 5000,
      distance: 100,
      size_range: [0.1, 1.0],
      size_count: 4,
      colors: [0xffffff, 0xEEEEEE, 0xDDDDDD]
    });
    this.starfield.addToScene(this.plotfields);

    window.THREE = THREE;

///// planets

    this.planetN = 210;
    for (var i=0; i<this.planetN; i++) {
      var planetattr = {
                            id: "randomplanet-" + i,
                            pos: Planet.randomPos({ radius: 2}),
                            vel: Planet.randomVel(),
                            rot: Planet.randomRot(),
                            moving: true,
                            mass: 1,
                            attr: { color: Helpers.randomColor(),
                                    name: "Planet-" + i,
                                    planetN: this.planetN,
                                    debugArrows: false,
                                     }
                         }
      if('params' in window && 'randomplanets' in window.params && window.params.randomplanets != false) {
        this.addPlanet(planetattr);
      }

    }

    var sunattr = {
                            id: "sunsunun",
                            pos: new THREE.Vector3(0,0,0),
                            vel: new THREE.Vector3(0,0,0),
                            rot: Planet.randomRot(),
                            mass: 300,
                            moving: false,
                            attr: { color: 0xfcf80c,
                                    name: "Sun",
                                    debugArrows: false,
                                    materialOverride: new THREE.MeshPhongMaterial({
                                      color: 0xce3221,
                                      emissive: 0xc3c259,
                                      specular: 0xffffbf,
                                      shininess: 20,
                                      transparent: false,
                                      opacity: 0.9 }),
                            }
                    }
    this.addPlanet(sunattr);


    window.planets = this.planets;

  }

  render() {
    timerCounter++;
    var self = this;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
    this.plotfields.rotation.y += 0.002;
    this.plotfields.rotation.x = Math.sin(timerCounter / 100) / 10;
    _.each(self.planets, function(v, k) {
       v.update(self.planets)
    });

    if(this.planetFocusID in this.planets) {
      this.UI.movePlanetFrame({
        obj: this.planets[this.planetFocusID],
        pos: this.planets[this.planetFocusID].pos
      });
    }
  }

  _setupScene() {
    var width = window.innerWidth,
        height = window.innerHeight,
        aspect = width/height,
        D = 1;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      canvas: document.getElementById('plotfields')
    });
    this.renderer.setClearColor(0xffffff, 0);
    this.renderer.setSize(width, height);

    this.scene = new THREE.Scene();
    if (CAMERATYPE === 'persp') {
      this.camera = new THREE.PerspectiveCamera(45, aspect, .1, 20000);


      if('params' in window && 'zoom' in window.params && window.params.zoom != false) {
        this.camera.zoom = parseFloat(window.params.zoom);
      } else {
        this.camera.zoom = 2;
      }

    } else {
      this.camera = new THREE.OrthographicCamera(-D*aspect, D*aspect, D, -D, 1, 1000),
      this.camera.zoom = 0.08;
    }

    this.camera.position.set(-3, 3, 3);
    this.camera.lookAt(this.scene.position);
    this.camera.updateProjectionMatrix();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false; // to keep speech bubble more consistently placed

    var self = this;
    window.addEventListener('resize', function() {
      var width = window.innerWidth,
          height = window.innerHeight;
      self.camera.aspect = width/height;
      self.camera.updateProjectionMatrix();
      self.renderer.setSize(width, height);
    }, false);


  }


  _setupLights() {
    var pointLight = new THREE.PointLight(0xffffff, 3.3, 2);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);

    var pointLight = new THREE.PointLight(0xffffff, 0.3, 50);
    pointLight.position.set(0, 20, 0);
    this.scene.add(pointLight);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    this.scene.add(new THREE.HemisphereLight(0xCCF0FF, 0xFFA1C7, 0.3));
  }
}

/////////////////////
/////////////////////
//

var APIbase = "https://library.cybernetics.social"
var books_endpoint = "/books"
var data = {}; data.planets = {};
var planetFocusID;
var fetchTimer;

function startApiLoop() {
    fetchData();
    fetchTimer = setInterval(fetchData, 1 * 1000)
  }

function fetchData() {
  $.getJSON(APIbase + books_endpoint, function(newdata) {
    if(!(_.isEqual(data, newdata))) {
      var diffkeys = _.difference(_.keys(newdata), _.keys(data));
      console.log(diffkeys);
      if( diffkeys.length > 0) {
        // there are new books!

        _.each(diffkeys, function(k) {
          var thisbook = newdata[k];
          console.log(k);

          console.log(thisbook)

          var planetattr = {
                          id: k,
                          pos: Planet.randomPos({ radius: 2 }),
                          vel: Planet.randomVel(),
                          rot: Planet.randomRot(),
                          mass: 2, 
                          moving: true,
                          attr: { color: new THREE.Color(Helpers.pRandomColor(k)),
                                  name: k, //TO CHANGE
                                  debugArrows: false,
                          }
                  }

          console.log(planetattr);
          plotfields.addPlanet(planetattr);

        });
        data = newdata;
      } else {
        // no new planets, but planet attributes have changed

				function diffBetweenObjects(a, b) {
					// from https://stackoverflow.com/questions/31683075/how-to-do-a-deep-comparison-between-2-objects-with-lodash
					return _.reduce(a, function(result, value, key) {
							return _.isEqual(value, b[key]) ?
									result : result.concat(key);
					}, []);
        }
        var diff = diffBetweenObjects(data, newdata);
        plotfields.planetFocusID = diff[0];

        _.each(diff, function(pid) {
          // last few planets is a queue
          plotfields.lastFewPlanets.push(pid);
          if(plotfields.lastFewPlanets.length > plotfields.lastFewPlanetN) { plotfields.lastFewPlanets.shift(); }
        });


        console.log("no new planets, but planet attributes have changed");
        console.log(diff);
        data = newdata;
      }
    } else {
      // nothing has changed!
//      console.log("no change");

    }
  })
}

// process url parameters into an obj; this is so that the planet name can be hidden when an iframe calls it. -Dan
function processUrlParams() {
  var search = window.location.search;
  let hashes = search.slice(search.indexOf('?') + 1).split('&')
  var params = hashes.reduce((params, hash) => {
      let [key, val] = hash.split('=')
      return Object.assign(params, {[key]: decodeURIComponent(val)})
  }, {})
  window.params = params;
}
processUrlParams();



///////////////////
////////////////////
//
window.THREE = THREE;
var plotfields = new Plotfields();
window.plotfields = plotfields;
plotfields.render();
startApiLoop();



