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
  constructor(
    private http: HttpClient
    ) {}
  ngAfterViewInit(): void {
    this.http.get('assets/json/geoJson.json').subscribe((res) => {
      this.geoJson = res;
      this.addBubbles();
      this.addLegend();
    });
   }

  ngOnInit() {
    this.initMap();
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
  max_radius : 40,
  scale: 'YlGnBu',
  tooltip : true
  });
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
addLegend(){
const legend = new L.Control({ position: 'bottomright' });
const max_radius = this.bubbles.options.max_radius;
const opacity = this.bubbles.options.style.opacity;
const max = this.getMax();
const normal = d3_scale.scaleLinear()
 .domain([0, max])
 .range([0, 1]);
legend.onAdd = () => {
 const div = L.DomUtil.create('div', 'info legend');
 div.innerHTML += '<strong>' + this.bubbles.options.property + '</strong><br/>';
 div.style = 'background-color: #FFF; padding: 8px; font-size: 14px; text-transform: capitalize'
 for (let i = 3; i > 0; i--) {
      const minArea = Math.PI * 3 * 3;
      const maxArea = Math.PI * this.bubbles.options.max_radius * this.bubbles.options.max_radius;
      const scale = d3_scale.scaleLinear()
  .domain([0, max])
  .range([minArea, maxArea]);
      const area = scale(max / i / 2);
      const radius = Math.sqrt(area / Math.PI)
      const item = L.DomUtil.create('div', 'bubble');
      if (this.bubbles.options.scale) {
    const fillScale = chroma.scale(this.bubbles.options.scale);
    if (fillScale) {
    this.fill = fillScale(normal(max / i));
    }
  }
      item.innerHTML = '<svg height="' + (max_radius * 2) + '" width="' + (max_radius * 2 - (max_radius / 2)) + '">' +
      '<circle cx="' + (radius + 1) + '" cy="' + max_radius + '" r="' + radius + '" stroke="' + chroma(this.fill).darken().hex() + '" stroke-width="1" opacity="' + opacity + '" fill="' + this.fill + '" />' +
      '<text font-size="11" text-anchor="middle" x="' + (radius) + '" y="' + (max_radius * 2) + '" fill="#AAA">' + numeral(max / i).format('0 a'); + '</text>' +
      '</svg>';
      item.style = 'float:left; width: ' + radius + ';';
      div.appendChild(item);
}
 return div;
 };
legend.addTo(this.map);

}
}

