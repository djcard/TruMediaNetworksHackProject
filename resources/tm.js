//Creates the STATS object which has the core code
var STATS=new co();

//Used to display month names 
var monthArray=['January','February','March','April','May','June','July','August','September','October','November','December'];

//To be accessible by the entire app, not just areas using d3
colors = d3.scale.category10();

// This feels like 'cheating' putting the names of the files 
//in here ahead of time but in reality this would be coming from a db
var loadarray={452655:'',457706:'',502082:''};
//var tempobj=new Object();
function init(){
	//Load the data from the JSON files
	STATS.loaddata(loadarray,document.getElementById('playerchoice').children.length,makeplayers);
	
	//Set up the legend under the game by game hitting. 
	document.getElementById('atbatlegend').style.backgroundColor=colors(0);
	document.getElementById('hitslegend').style.backgroundColor=colors(1);
	document.getElementById('hrslegend').style.backgroundColor=colors(2);
	document.getElementById('monthlegend').style.backgroundColor=colors(3);
	document.getElementById('tradelegend').style.backgroundColor='blue';
	document.getElementById('streaklegend').style.backgroundColor='red';	
	document.getElementById('asglegend').style.backgroundColor='black';
	
}

function resetCenter(){
	document.getElementById('centerlower').innerHTML='';
}

function makeplayers(){
	//D3 draws the players' images on the right side. In order to handle some sporadic 
	//load failures in testing a pop up window was added to ask if the user wanted to proceed
	// if a players' data didn't load. 
	d3.select('#playerchoice')
		.selectAll('div')
		.data(STATS.playerArray)
		.enter()
	 	.append('div')
	 	.attr('id',function(d,i){return 'playerchoiceimage' + i})
	 	.append('img')
	  	.attr('src',function(d){if(!d || !d.hasOwnProperty('image')){if(confirm('Oops, something went wrong loading the player info. Please click OK to reload or Cancel to continue as is')){window.location=window.location}}else{return d.image}})
	 	.attr('data-playerorder',function(d,i){return i})
	 	.on('click',function(d,i){setplayer(this.dataset.playerorder)});
	 var t=d3.select('#playerchoice')
	 	.selectAll('div')
	 	.append('span')
	 	.attr('data-playerorder',function(d,i){return i})
	 	.on('click',function(d,i){setplayer(this.dataset.playerorder)})
	 	.html(function(d){return d.name})
	 	
}

//Fired when a player is selected
function setplayer(e){
	//Clean out the stats object
	STATS.reset();
	
	//Clean out the stats displayed in the center of the screen
	document.getElementById('centerlower').innerHTML='';
	
	//highight the player's image
	document.getElementById('playerchoiceimage' + e).className='active';
	
	//Put this player's stats into the main STATS object
	STATS.setStats(STATS.playerArray[e]);
	
	//Publish the player's name
	populatePlayer();	
	
	//Publish this player's years' aggregate stats 
	publishYear();
	
	//Publish this players' year long opponents
	publishTeamList();
	
	//Publish the Months in the baseball season
	publishMonths();
	
	//Publish the Game by Game bar graph below. 
	publishYearHits();
}

function populatePlayer(){
	//Display the players' names
	document.getElementById('playername').innerHTML=STATS.player.name;
	
	//Sets the Tab to the player's name
	document.title=STATS.player.name + " 's Stats for 2014";
	
	//Loop through the games to get the teams the player played with throughout the season in order to display
	// on the top row. Looping through allows displaying multiple teams to account for trades etc.  
	var keys=Object.keys(STATS.player.teams);
	if(keys.length){
		document.getElementById('playername').innerHTML=document.getElementById('playername').innerHTML + ' - '
	}
	for(var x=0;x<keys.length;x++){
		document.getElementById('playername').innerHTML=document.getElementById('playername').innerHTML + STATS.player.teams[keys[x]].name;
		if(x<keys.length-1){
			document.getElementById('playername').innerHTML=document.getElementById('playername').innerHTML + ','; 
		}
	}
}

function publishTeamList(){
	//get the TeamsArray from the main stats object
	var dt=STATS.yearTeamArray;
	
	//Decide if we are updating already existing images or creating new ones
	var isin=document.getElementById('opponents').childNodes.length
	
	//If we are updating
	if(isin>1){
		//If we are updating, make all of the current images invisible
		d3.select('#opponents')
			.selectAll('img')
			.style('display','none');
		
		//Update all of the images with the new players' images
		d3.select('#opponents')
			.selectAll('img')
			.data(dt)
			.attr('src',function(d){return d.image})
			.attr('data-teamname',function(d){return d.name})
			.attr('alt',function(d){return d.name})
			.attr('title',function(d){return d.name})
			.style('display','inline')
			.attr('class','logo')			
			.on('click',function(d){resetlogos();this.className="logo active";getsubdata(this['__data__'])})
	}
	//If we are adding images for the first time
	else{
		var t= d3.select('#opponents')
			.selectAll('img')
			.data(dt)
			.enter()
			.append('img')
			.attr('src',function(d){return d.image})
			.attr('data-teamname',function(d){return d.opp})
			.attr('alt',function(d){return d.name})
			.attr('title',function(d){return d.name})
			.attr('class','logo')
			.on('click',function(d){resetlogos();this.className="logo active";getsubdata(this['__data__'])})
	}
}

function publishMonths(){
	//Get the month breakdown from the main STATS object
	var dt=STATS.yearMonthBreakDown;
	
	//Publish the month buttons
	d3.select('#monthlist')
		.selectAll('button')
		.data(dt)
		.enter()
		.append('button')
		.attr('data-monthnum',function(d,i){return i+1})
		.attr('class','btn btn-info')
		.style('display',function(d,i){if(i>1 && i<9){return 'block'} else{return 'none'}})
		.style('width','100%')
		.style('margin-bottom','3px')
		.on('click',function(){getsubdata(this.dataset)})
		
		.html(function(d,i){return monthArray[i] })
}

//Resets the team logos to the default class in order to remove the highlight either on clearing 
//or when a new team is chosen.
function resetlogos(){
	d3.select('#opponents')
		.selectAll('img')
		.attr('class','logo')
}

//Publishes the players' yearlong stats
function publishYear(){
	//Get the year stats which are encoded in the main stats object 
	var keys=Object.keys(STATS.yearPlayerStats)
	
	//Are we creating or updating those divs?
	var isin=document.getElementById('yearstats').childNodes.length;
	if(isin >1){
		//Hide all of the current divs in case a players' data is incomplete and a stat could not be included.
		d3.select('#yearstats')
			.selectAll('div')
			.style('display','none');
		//Publish the stats in STATS.yearPlayerStats
		d3.select('#yearstats')
			.selectAll('div')
			.style('display',function(d){if(STATS.yearPlayerStats[d]==''){return 'none'}else{return 'block'}})
			.html(function(d){return d + ':' + STATS.yearPlayerStats[d]});
	}
	else{
		//Publish the year stats for the first player selected and only displaying the stats that have values 
		d3.select('#yearstats')
			.selectAll('div')
			.data(keys)
			.enter()
			.append('div')
			.attr('class','col-lg-2')
			.style('display',function(d){if(STATS.yearPlayerStats[d]==''){return 'none'}else{return 'block'}})
			.html(function(d){return d + ':' + STATS.yearPlayerStats[d]})
	}
		
}

//Create the Game By Game Bar Chart
function publishYearHits(){
	//Gets the size available for the game by game display
	rwidth=parseInt(window.getComputedStyle(document.getElementById('yearhits')).width);
	var st=d3.layout.stack();
	//Preps the stats objects from the main STATS object to be run through the d3 layout process.  
	conv1=prephab();
	useme=st(conv1);
	
	//Set up the X and Y scales based on the available size
	var xScale = d3.scale.ordinal()
		.domain(d3.range(conv1[0].length))
		.rangeRoundBands([0, rwidth], 0.05);
		
	var yScale = d3.scale.linear()
		.domain([0,				
			d3.max(conv1, function(d) {
				return d3.max(d, function(d) {
					return d.y0 + d.y;
				});
			})
		])
		.range([0, 100]);
	
	var svg=d3.select('#yearhits')
	
	//Remove all the rects in the stats area to clear it for a new "draw"
	svg.selectAll('g').remove();
	
	//Create the groups in the SVG area
	var groups = svg.selectAll("g")
			.data(useme)
			.enter()
			.append("g")
			.style("fill", function(d, i) {
				return colors(i);
			});
	
	//Creates the rects under the groups. These rects are the At Bats, Hits and HR display 
	var rects=groups.selectAll('rects')
		.data(function(d){ return d})
		.enter()
		.append('rect')
		.attr('x',function(d,i){return xScale(i)})
		.attr('y',function(d){return 100-yScale(d.y)})
		.attr('height',function(d){return yScale(d.y)})
		.attr('width',xScale.rangeBand())
		.attr('class','bars')
		.style('border','thin solid black')
		.on('click',function(d){dailysnapshot(d)})
		.append('title')
		.text(function(d){return d.y})
		;
	
	//Draw the Transitions (end of month, trades, all star break etc). This is aided by passing in the 
	//xScale from the d3 framework. 
	drawTransitions(STATS.yearTransitions,xScale);
	
	//Draw the players' streaks above the game by game display. This is also aided by the scales from the d3 framework. 
	drawstreaks(STATS.yearPlayerStreaks,xScale,xScale.rangeBand())
}

function drawTransitions(transObj,offSet){
	//This is an offset for trades that occur close to each other to be vertically staggered (this was inspired by Austin Jackson
	// in this exercie since the data said he went back and forth from DET to SEA several times but I think this is a typo in the data. 
	// However, since it's a theoretical possibility, it is accounted for. 
	var teamoffset=10;
	
	//Greats a new group in the SVG to draw the transitions
	var newgroup=d3.select('#yearhits')
		.append('g');
		
	//Draws the Transitions onto the SVG
	newgroup.selectAll('rect')
		.data(transObj)
		.enter()
		.append('rect')
		.attr('x',function(d,i){return offSet(d.index)-1})
		.attr('y',0)
		.attr('fill',function(d){if(d.type=='month'){return 'green'}else if(d.type=='team'){return 'blue'}else if(d.type=='asb'){return 'black'}})
		.attr('width','2')
		.attr('height','100');
	
	//Draw the text onto the SVG. There is probably a more elegant way to make the text function more dynamic,
	//expandable, and easier to maintain but it works for the requirements at the moment. 
	newgroup.selectAll('text')
		.data(transObj)
		.enter()
		.append('text')
		.text(function(d,i){if(d.type=='month'){return monthArray[parseInt(d.value)-1]}else if(d.type=='team'){return d.value}else if(d.type=='asb'){return 'All Star Break'}})
		.attr("font-size","10px")
		.attr("font-family","sans-serif")
		.attr('y',function(d){if(d.type=='month' || d.type=='asb'){return 10}else{if(teamoffset==20){teamoffset=30}else{teamoffset=20};return teamoffset}})
		.attr('x',function(d,i){return offSet(d.index)+4})
}

//Draws the streaks above the Game By Game display.
function drawstreaks(strks,offset,w){
	//Removes all the streaks to allow redrawing
	d3.select('#streaks').selectAll('rect').remove();
	
	//Draws the streaks using the data passed in. This is that if we decide we want to draw streaks from other collections (i.e. catches, put puts, errors, whatever)
	//we can pass in other sets of "streak data" and it will work. 
	d3.select('#streaks')
		.selectAll('rect')
		.data(strks)
		.enter()
		.append('rect')
		.attr('height','10px')
		.attr('width',function(d){return d.run*w})
		.attr('x',function(d,i){return offset(d.start)})
		.style('fill','#F00')
		.append('text')
		.text(function(d){return d.run})
		.on('click',function(d){alert(d.start + ':' + d.end + ':' + d.run)})
		.append('title')
		.text(function(d){return d.run})
		

}//Preps the data set to be run through the d3.layout function. There are three arrays - At Bats, Hits, HRs
function prephab(){
	
	var temps=new Array();
	temps[0]=new Array();
	temps[1]=new Array();
	temps[2]=new Array();

	var ind=0;
	for(var row=0;row<STATS.games.length;row++){
		var atBats=new Object();
		var hits=new Object();
		var hrs=new Object();
		var innerArrayBats=new Array();
		atBats.x=ind;
		atBats.y=STATS.games[atBats.x].AB;
		temps[0].push(atBats);
		var innerArrayHits=new Array();
		hits.x=ind;
		hits.y=STATS.games[hits.x].H;
		temps[1].push(hits);
		var innerArrayBats=new Array();
		hrs.x=ind;
		hrs.y=STATS.games[atBats.x].HR;
		temps[2].push(hrs);	
		ind++;
	}
	return temps;
}

//This is the base HTML for each off the data sets being displayed in the middle of the screen. 
function makeDisplayItem(){
	var wrap=document.createElement('div');
	wrap.className='col-lg-12 statswrapper';
	var labeller=document.createElement('div');
	labeller.className='col-lg-2 sidelabel';
	var content=document.createElement('div');
	wrap.appendChild(labeller);
	wrap.appendChild(content);
	return wrap;
}

//Publishes the information from a single game when a bar is clicked on the Game By Game display
function dailysnapshot(e){
	//Standardize the order of the properties being display. Data coming directly from the raw data provided is in a different order
	// then data coming from the statsObj object from STATS. Since there is always the possibility (probability) of using multiple data
	//sources, if made sense to have a way of standardizing the order so skimming the screen was easier. 
	dailystats=STATS.standardizeOrder(STATS.games[e.x]);
	
	//Get a statsObj from STATS to act as a list of stats we want to display
	var compareme=new statsObj();
	
	//Calculate the Batting Average for this day's stats since it was not in the raw data
	STATS.calcBA(dailystats);
	
	//Create the basic HTML for the stats display
	var w=makeDisplayItem();
	
	//Get the list of stats we want to display
	var keys=Object.keys(dailystats);
	
	//loop through the list of stats, extract them from the submitted object and put them in second child
	//of the default HTML layout. 
	d3.select(w.children[1])
		.selectAll('div')
		.data(keys)
		.enter()
		.append('div')
		.attr('class','col-lg-2')
		.style('display',function(d){if(compareme.hasOwnProperty(d) && !isNaN(parseInt(dailystats[d]))){return 'block'}else{return 'none'}})
		.html(function(d){return d + ':' + dailystats[d]});
		
	//Put the label in the side panel of the stats display in the middle.
	w.children[0].innerHTML=dailystats.date + ' vs. ' + dailystats.opp
	
	//put the stat in the center of the screen. 
	document.getElementById('centerlower').appendChild(w);
}

//The primary function uses to filter through aggregate team and month stats
function getsubdata(d){
	
	//Get the template to hold the calculated stats
	var thisitem=STATS.tempDataObj();
	
	//Filter through the years' games based on the criteria. 
	//Passes in the object to hold the filtered info.	
	STATS.filterGames(d,thisitem.games);
	
	//Passes in the filtered collection of games to pull out the aggregate data 
	//such as H/AB/RBI/HR/AVG, teams, streaks, transitions
	STATS.pullAggregates(thisitem.games,thisitem.stats,thisitem.streaks,thisitem.teams,thisitem.months,thisitem.transitions)
	
	//Highlights the game by game display at the bottom of the screen with the games in the filtered list
	highlightgamelist(thisitem.games);
	
	//Makes the default HTML for the stats display in the center of the screen. 
	var w=makeDisplayItem();
	
	//Attaches the data to the stats' DOM. This keeps the filtered data close
	// in case we want to do something with the data later/
	w.setAttribute('data-stats',d);
	
	//Sets the label in the side panel based on the type of filtering done. 
	var keys=Object.keys(thisitem.stats);
	if(d.hasOwnProperty('name')){
		w.children[0].innerHTML='vs. ' + d.name + ' (' + thisitem.games.length + ' games)';
	}
	else if(d.hasOwnProperty('monthnum')){
		w.children[0].innerHTML='Month of ' + monthArray[d.monthnum-1] + ' (' + thisitem.games.length + ' games)';
	}

	//Attaches the stats display to the second child of the default HTML layout. 
	d3.select(w.children[1])
		.selectAll('div')
		.data(keys)
		.enter()
		.append('div')
		.attr('class','col-lg-2')
		.style('display',function(d){if(STATS.yearPlayerStats[d]==''){return 'none'}else{return 'block'}})
		.html(function(d){return d + ':' + thisitem.stats[d]});
		
	//Attaches the stat display to the center of the screen. 
	document.getElementById('centerlower').appendChild(w);
}

function highlightgamelist(d){
	//resets the Game By Game Display to the default colors
	resetGameVisuals();
	
	//Loops through all of the rects in the SVG area and 
	//assigns them a highlighted color based on their group
	var t=document.getElementById('yearhits');
	for(var x=0;x<d.length;x++){
		try{t.childNodes[1].childNodes[d[x].index].style.fill="#AAA";}catch(err){w=err.message};
		try{t.childNodes[2].childNodes[d[x].index].style.fill="#CCC";}catch(err){};
		try{t.childNodes[3].childNodes[d[x].index].style.fill="#EEE";}catch(err){};	
	}
}

//Resets the Game By Game visuals to their default colors
function resetGameVisuals(){
	var t=document.getElementById('yearhits').childNodes;
	
	//Loops through the groups and their rects in the SVG area to restore them to their default colors. 
	for(var g=1;g<t.length;g++){
		var r=t[g].childNodes;
		d3.select(t[g])
			.selectAll('rect')
			.style('fill',colors(g-1))
			.on('mouseover',function(d){this.style.backgroundColor='blue'})
		/*
		for(var x=0;x<r.length;x++){
			r[x].style.fill=colors(g-1);
			r[x].mouseover=function(){this.style.fill='blue'}
		}*/
	}
}