
(function () {
  const data = {};
  const Sankey = require('d3-sankey').sankey;
  const dataJson = require('./goc.json');
  const $ = require('jquery')
  const nodeMap = {};
  const margin = {top: 30, right: 1, bottom: 50, left: 1};
  const width = (960 - margin.left - margin.right);
  const height = 1400 - margin.top - margin.bottom;
  const color = d3.scale.category20();
  let DATA = require('./goc.json');
  let current_year = 2016;
  //lookup node target and source names to map them later

  let lookup = {};
  let result = [];
  let items = DATA;

  let years =[];

  for (let item, i = 0; item = items[i++];) {
    let name = item.Ulke;
    let sector = item.Sektor;
    let year = item.Yil;

    if (!(name in lookup)) {

      lookup[name] = 1;
      result.push(name);
    } else if (!(sector in lookup)){

      lookup[sector] = 1;
      result.push(sector);
    }else if ((name in lookup)) {
      lookup[name] += 1;
    }
    if (!(years.includes(year)) && (year != null) && (year < 2018)) {
      years.push(year)
    }
  }
years = years.sort();
years.push("hepsi")
// $('#mySlider').prop('max', years.length-1);

console.log(years);
$("#rangeInput").prop({
    max: years.length - 1
  })
$("#rangeInput").val(years.indexOf(2016));

$("#rangeInput").on("input", function(){
  current_year = years[this.value];
  $("#year").val(current_year);
  d3.selectAll("svg").remove();

  update(current_year);
});


$("#year").val(current_year);
update(current_year);
function update(year){


    data.nodes = [];
    for (item in lookup ){
      let obj ={};
      obj.name = item;
      data.nodes.push(obj)
    }

    data.nodes.forEach(function(x){
      nodeMap[x.name] = x});

    data.links = dataJson.reduce(function(result, curr) {
      result[curr.Sektor + "_" + curr.Ulke] = {
        year: curr.Yil,
        source: curr.Sektor,
        target: curr.Ulke,
        class: curr.Ulke.replace(/\s+/g, '')+" "+ curr.Sektor.replace(/\s+/g, '')+" link",
        value: (result[curr.Sektor + "_" + curr.Ulke] || { value: 0 }).value + 1,
      };

      return result;
    }, {});

    data.links = Object.keys(data.links).map(function(key) {return data.links[key]});


    data.links = data.links.map(function(x){
      return {
        year:x.year,
        source: nodeMap[x.source],
        target: nodeMap[x.target],
        class: x.class,
        value: x.value
      }
    });

    const svg = d3.select("#goc").append("svg")
            .attr({
              width: width + margin.left + margin.right,
              height: height + margin.top + margin.bottom
            })
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



    const sankey = Sankey()
            .nodeWidth(30)
            .nodePadding(10)
            .size([width, height]);

    const path = sankey.link();

    sankey.nodes(data.nodes)
      .links(data.links)
      .layout(32);

    const link = svg.append("g").selectAll(".link")
            .data(data.links)
            .enter()
            .append("path")
            .attr('class',function(d){
              return d.class;
            })
            .attr("id", function(d,i){
              d.id = i;
              return "link-"+i;
            })
            .attr({
              d: path
            })
            .style("stroke", function(d){
              if (year == "hepsi"){
                return d.color = color(d.target.name.replace(/ .*/, ""));
              }else if( d.year == year){
                return d.color = color(d.target.name.replace(/ .*/, ""));
              }
            })
            .style("stroke-width", function (d) {

              return Math.max(1, d.value);
            })
    link.append("title")
            .text(function (d) {
              return d.source.name + " to " + d.target.name + " = " + d.value;
            });

    const nodes = svg.append("g").selectAll(".node")
            .data(data.nodes)
            .enter()
            .append("g")
            .attr('class'," node")
            .attr({
              transform: function (d) {
                return "translate(" + d.x + "," + d.y + ")";
              }
            })
            .call(d3.behavior.drag()
            .origin(function(d) { return d; })
            .on("dragstart", function() {
      		  this.parentNode.appendChild(this); })
            .on("drag", dragmove))
            .on("mouseover", fade(0.3))
    			  .on("mouseout", fade(1));

    nodes.append("rect")
            .attr({
              height: function (d) {
                return d.dy;
              },
              width: sankey.nodeWidth()
            })
            .style({
              fill: function (d) {
                return d.color = color(d.name.replace(/ .*/, ""));
              }
            })
            .append("title")
            .text(function (d) {
              return d.name;
            });
    nodes.append("text")
            .attr("x", -6)
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) {
              if(d.sourceLinks.length != 0 || d.targetLinks.length != 0)
              return d.name; })
            .filter(function(d) { return d.x < width / 2; })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");


    function dragmove(d) {
      d3.select(this).attr("transform",
          "translate(" + (
          	   d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))
          	) + "," + (
                     d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
              ) + ")");
      sankey.relayout();
      link.attr("d", path);
    }

    function fade(opacity) {
     return function(g, i) {
       let elements = svg.selectAll(".node");
       let myarray = [];
       myarray.push(data.nodes[i].name);
       g.sourceLinks.forEach(function(source){
         myarray.push(source.target.name);
       });
       g.targetLinks.forEach(function(source){
         myarray.push(source.source.name);
       });
       myarray.forEach(function(source){
         elements = elements.filter(function(d) { return d.name != source })
       })

       elements.transition()
           .style("opacity", opacity);

       svg.selectAll(".link")
           .filter(function(d) { return d.source.name != data.nodes[i].name && d.target.name != data.nodes[i].name })
         .transition()
           .style("opacity", opacity);
     };
    }
  }
})();
