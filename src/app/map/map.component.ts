import { AfterViewInit, Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import 'src/assets/js/leaflet-bubble.js';
import 'src/assets/js/BubbleLayer.js';
import { HttpClient } from '@angular/common/http';
import * as d3_scale from 'd3/dist/d3.min.js';
import * as chroma from 'chroma-js/docs/libs/chroma.min.js';
import * as numeral from 'numeral/numeral.js';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit {
  private geoJson;
  private map;
  private bubbles;
  fill: any;
  legend: any;
  maxRadius: any;
  opacity: any;
  max: number;
  normal: any;
  minArea: number;
  maxArea: number;
  scale: any;
  constructor(
    private http: HttpClient
    ) {}
  ngOnInit() {
    this.initMap();
  }
  ngAfterViewInit(): void {
    this.http.get('assets/json/geoJson.json').subscribe((res) => {
      this.geoJson = res;
      this.addBubbles();
      this.addLegend();
    });
   }
  initMap(){
    this.map = L.map('map', {
      center: [ 39.8282, -98.5795 ],
      zoom: 3
    });
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    tiles.addTo(this.map);
}
addBubbles(){
 this.bubbles = L.bubbleLayer(this.geoJson,
  {property: 'population',
  legend: false,
  maxRadius : 40,
  scale: 'YlGnBu',
  tooltip : true
  });
 this.legend = new L.Control({ position: 'bottomright' });
 this.maxRadius = this.bubbles.options.maxRadius;
 this.opacity = this.bubbles.options.style.opacity;
 this.max = this.getMax();
 this.normal = d3_scale.scaleLinear()
 .domain([0, this.max])
 .range([0, 1]);
 this.bubbles.addTo(this.map);
 }
 getMax() {
  let max = 0;
  const features = this.geoJson.features;
  const property = this.bubbles.options.property;
  for (var i = 0; i < features.length; i++) {
      if (features[i].properties[property] > max) {
          max = features[i].properties[property];
      }
  }

  return max;
}
getScale(){
  this.minArea = Math.PI * 3 * 3;
  this.maxArea = Math.PI * this.bubbles.options.maxRadius * this.bubbles.options.maxRadius;
  this.scale = d3_scale.scaleLinear()
.domain([0, this.max])
.range([this.minArea, this.maxArea]);
}
addLegend(){
this.legend.onAdd = () => {
 const div = L.DomUtil.create('div', 'info legend');
 div.innerHTML += '<strong>' + this.bubbles.options.property + '</strong><br/>';
 div.style = 'background-color: #FFF; padding: 8px; font-size: 14px; text-transform: capitalize'
 for (let i = 3; i > 0; i--) {
      this.getScale();
      const area = this.scale(this.max / i / 2);
      const radius = Math.sqrt(area / Math.PI)
      const item = L.DomUtil.create('div', 'bubble');
      if (this.bubbles.options.scale) {
    const fillScale = chroma.scale(this.bubbles.options.scale);
    if (fillScale) {
    this.fill = fillScale(this.normal(this.max / i));
    }
  }
      item.innerHTML = '<svg height="' + (this.maxRadius * 2) + '" width="' + (this.maxRadius * 2 - (this.maxRadius / 2)) + '">' +
      '<circle cx="' + (radius + 1) + '" cy="' + this.maxRadius + '" r="' + radius + '" stroke="' + chroma(this.fill).darken().hex() + '" stroke-width="1" opacity="' + this.opacity + '" fill="' + this.fill + '" />' +
      '<text font-size="11" text-anchor="middle" x="' + (radius) + '" y="' + (this.maxRadius * 2) + '" fill="#AAA">' + numeral(this.max / i).format('0 a'); + '</text>' +
      '</svg>';
      item.style = 'float:left; width: ' + radius + ';';
      div.appendChild(item);
}
 return div;
 };
this.legend.addTo(this.map);

}
}

