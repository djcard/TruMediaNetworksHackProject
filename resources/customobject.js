//The primary STATS object to holds and processes the stats content in the app. 

//The primary function which creates the objecct
function co(){
	return objme;
}

//The object used to hold a single collection of stats either for a game, year, against a team etc. 
statsObj=function(){
	var so={
	H:'',
	AB:'',
	AVG:'',
	BB:'',
	EB:'',
	FB:'',
	HBP:'',
	HR:'',
	K:'',
	SF:'',
	SH:'',
	TB:'',
	PA:'',
	PO:'',
	SB:'',
	CS:'',
	R:'',
	RA:'',
	RBI:'',
	SLG:'',
	OBP:'',
	ISP:'',
	leaguefactor:'',
	parkfactor:''
	}
	return so;
}

//The definition of a player for this app
player={
	id:'',
	image:'',
	name:'',
	teams:{},
	getteams:function(g){
		this.teams=new Object();
		for(var x=0;x<g.length;x++){
			if(!this.teams.hasOwnProperty(g.team)){
				var t=new Object();
				t.name=g[x].team;
				t.image=g[x].teamImage;
				this.teams[g[x].team]=t;
			}
		}
	}
}


//defines a 'team' property
team=function(){
	this.id='';
	this.name='';
	this.image='';
	this.games=[];
	this.gamelist='';
	return this;
}

//The primary STATS object
objme={
	// Holds the players loaded into the app
	playerArray:[],
	
	//Defines the 
	player:player,
	
	//Holds this player's year long games as an Array
	games:[],
	
	//The player's calculated stats extracted from their submitted games. 
	yearPlayerStats: new statsObj(),
	
	//The player's streaks extracted from their submitted games
	yearPlayerStreaks:[],
	
	//The opponents the player faced throughout the year as an array of team objects extracted from the
	//player's submitted games
	yearTeamArray:[],
	
	//The transitions (month changes, trades, etc) extracted from the player's submitted games
	yearTransitions:[],
	
	//The player's stats by month as extracted from the submitted games
	yearMonthBreakDown:[],

	//A listing of the players currently be loaded into the main app. 
	playerstoload:{},
	
	//Returns a new team object
	newteam:function(){team},
	
	//Resets the current player's info. 
	resetPlayer:function(){this.player=player;this.games=[]},

	//Cleans out the years's data
	resetYearData:function(){this.yearPlayerStats=new statsObj();this.yearPlayerStreaks=[],this.yearTeamArray=[]},
	
	//Resets the Year Transitions
	resetYearTransitions:function(){this.yearTransitions=[]},
	
	//Loads submitted data
	setStats:function(d){
		//Cleans out the storage
		this.resetYearData();
		//populates the player's info
		this.player.id=d.id;
		this.player.image=d.image;
		this.player.name=d.name;
		
		//attaches the submitted games
		this.games=d.games;
		//Extracts the teams on which the player played
		this.player.getteams(this.games);
		
		//Extracts the aggregate stats from the submitted games
		this.pullAggregates(d.games,this.yearPlayerStats,this.yearPlayerStreaks,this.yearTeamArray,this.yearMonthBreakDown,this.yearTransitions);
	},
	
	//Is the entry way for processing the aggregate stats of submitted games
	pullAggregates:function(d,statsObj,streakObj,teamObj,monthObj,transObj){
		//Error Handling
		if(!Array.isArray(d)){return 'Submission is not an Array'};
		
		//Extracts the stats
		this.pullStats(d,statsObj);
		
		//Exracts the streaks
		this.pullStreaks(d,streakObj);
		
		//Extract the opponents
		this.pullTeams(d,teamObj);
		
		//Extracts Month data
		this.pullMonths(d,monthObj);
		
		//Extracts the transitions
		this.makeYearTransitions(d,transObj);
	},
	
	//Pulls the raw "Counting" stats (H/AB/R/RBI etc) from the submitted data
	pullStats:function(d,statsObj){
		//Error Handling
		if(!Array.isArray(d)){return 'Submission is not an Array'};
		
		//Gets what stats are submitted in the raw data object to accomodate many formats as long
		//as they use standard abbreviations. 
		keys=Object.keys(d[0]);
		
		//Loops through the rows and keys in the raw data and places them in the submitted statsObj. 
		for(var x=0;x<d.length;x++){
			for(var y=0;y<keys.length;y++){
				if(statsObj.hasOwnProperty(keys[y])){
					if(statsObj[keys[y]]==''){statsObj[keys[y]]=0}
					statsObj[keys[y]]=statsObj[keys[y]]+parseInt(d[x][keys[y]]);
				}
			}
		}
		
		//Calculates the computed stats (AVG, SLG, OPS etc after the counting stats are in
		this.calcHigherStats(statsObj);
	},
	
	//Pulls the streak data from the submitted games
	pullStreaks:function(d,streakObj){
		//Error Handling
		if(!Array.isArray(d)){return 'Submission is not an Array'};
		
		//Submits this row for streak checking
		for(var x=0;x<d.length;x++){
			this.checkstreak(x,d[x]['H'],streakObj);
		}
	},
	
	//Assess if this row impacts a streak
	checkstreak:function(gamenum,hits,streakObj){
		//Does this row start a streak (or end one if it is the last game of the season)?
		if(hits>0){
			if(streakObj.length==0){
				var str=new Object();
				str.start=gamenum;
				streakObj.push(str);
			}
			else if(streakObj[streakObj.length-1].hasOwnProperty('end')){
				var str=new Object();
				str.start=gamenum;
				streakObj.push(str);
			}
			if(gamenum==this.games.length-1){
				streakObj[streakObj.length-1]['end']=gamenum+1;
				streakObj[streakObj.length-1]['run']=parseInt(streakObj[streakObj.length-1]['end']) - parseInt(streakObj[streakObj.length-1]['start']);
			}
			
		}
		//Does this row end a streak
		else if(hits==0 && streakObj.length>0 && streakObj[streakObj.length-1].hasOwnProperty('start') && !streakObj[streakObj.length-1].hasOwnProperty('end')){
			streakObj[streakObj.length-1]['end']=gamenum;
			streakObj[streakObj.length-1]['run']=parseInt(streakObj[streakObj.length-1]['end']) - parseInt(streakObj[streakObj.length-1]['start']);
		}
	},
	
	//Extracts Opponents
	pullTeams:function(d,teamObj){
		//Error Handling
		if(!Array.isArray(d)){return 'Submission is not an Array'};
		//Makes a new object to work in
		var tempObj=new Object();
		
		//Loops through the games submitted
		for(var x=0;x<d.length;x++){
			//Submits this team to see if it should be added or not.
			tempObj=this.checkteam(x,d[x],tempObj);
		}
		//Transfers the data in the working object to an Array to be used in the App. 
		for(var x in tempObj){
			teamObj.push(tempObj[x]);
		}
	},
	
	//Support function to pull opponents from submitted games
	checkteam:function(rownum,d,teamObj){
			var teamer=d.opp;
			//Checks to see if this opponent is already accounted for.
			if(!teamObj.hasOwnProperty(teamer)){
			
				//If not, it creates a new team object to hold the team's data 
				teamObj[teamer]=new team()
				teamObj[teamer].image=d.oppImage;
				teamObj[teamer].name=d.opp;
				teamObj[teamer].games=[];
			}
			
			//Adds this game number to the the team's object for cross 
			// referencing the Game By Game Highlighting
			teamObj[teamer].games.push(rownum);
			return teamObj;
	},
	
	//Extracts aggregate data from the submitted games based on the month
	pullMonths:function(d,monthObj){
		//Loops through all the games
		for(var x=0;x<d.length;x++){
			
			//The dates are formatted in "yyyy-mm-dd" format as a string. This allows comparison without
			//converting all to dates. 
			datearr=d[x].date.split('-');
			
			//If this month has no data yet, it creates a statsObj to hold its data. 
			if(!monthObj[parseInt(datearr[1])]){
				monthObj[parseInt(datearr[1])]=new statsObj();
			}
			
			//Loop through all the keys in the statsObj and add this row's data to the apporpriate stat
			//in the appropriate month
			for(var y in d[x]){
				if(monthObj[parseInt(datearr[1])].hasOwnProperty(y)){
					var q=monthObj[parseInt(datearr[1])];
					if(q[y]==''){q[y]=0}
					q[y]=q[y]+parseInt(d[x][y]);
				}
			}
		}
	},
	
	//resets everything
	reset:function(){this.resetPlayer();/*this.resetCurrentData()*/;this.resetYearData(),this.resetYearTransitions()},
	
	//returns a new team
	newteam:function(){return team},
	
	//Checks if all the players submitted are loaded. 
	//If so, it calls the submitted callback function 
	checkplayersloaded:function(callback){
		var checknum=Object.keys(playerstoload).length;
		if(this.playerArray.length==checknum){
			callback();
		};
	},
	//Loads the data for the submitted players
	loaddata:function(d,startnum,callback){
		//Track the players needing to be loaded
		playerstoload=d;
		
		//We need to reference in which order they were loaded to keep the 
		//correct stats with the correct player name and image
		keys=Object.keys(d);
		
		//The 'startnum' is here because the app might later do multiple rounds of loading players if
		//the user is searching a DB and wants to add more people to his search. The startnum allows this to 
		//happen. 
		for(var x=startnum;x<keys.length+startnum;x++){
			//Assigns this player with an order being loaded
			playerstoload[keys[x-startnum]]=x;
			
			//This is here to avoid scope issues with the callback function
			var obj=this;
			
			//From a web server, d3 will load the JSON automatically. However, since the instructions said
			//"Static Web Files we can run in a browser", there was no guarentee that the files would be 
			//served from an actual server. Therefore, the AJAX wouldn't run due to security issues. As a backup,
			//if the AJAX fails, the app loads the info from the embedded data in data/playerinfo.js 
			try{
				d3.json('data/' + keys[x] + '.json',
					function(e){
						if(!e){
							obj.playerArray[playerstoload[keys[x]]]=JSON.parse(backupplayerarray[keys[x]]);
						}
						else{
							obj.playerArray[playerstoload[e.id]]=e;
						}
						obj.checkplayersloaded(callback)
					})
			}
			catch(err){
				obj.playerArray[playerstoload[keys[x]]]=JSON.parse(backupplayerarray[keys[x]]);
				obj.checkplayersloaded(callback)
			}
		}
	},
	
	//The entry function to filter submitted games based on submitted criteria
	filterGames:function(criteria,gamesObj){
		//Loop through the games
		for(var x=0;x<this.games.length;x++){
		
			//If the filter is based on a team...
			if(criteria.hasOwnProperty('name')){
				if(this.games[x].opp==criteria.name){
					this.games[x].index=x;
					gamesObj.push(this.games[x]);
				}
			}
			
			//If the filter is based on a month...
			else if(criteria.hasOwnProperty('monthnum')){
				if(parseInt(this.games[x].date.split('-')[1])==criteria.monthnum){
					this.games[x].index=x;
					gamesObj.push(this.games[x]);
				}
			}
			
		}
	},
	
	//Finds transitions in the submitted games
	makeYearTransitions:function(d,transObj){
		//variables to track the "last" team or month submitted to see if the current row is a change. 
		//This starts off with the first index's values.
		var lastteam=d[0].team;
		var lastmonth=d[0].date.split('-')[1];
		
		//Loop through the submitted games
		for(var x=0;x<d.length;x++){
			//A special hard coded case to account for teh 2014 allstar game
			if(d[x].date=='2014-07-13'){
				var trans=new Object();
				trans.type='asb';
				trans.index=x;
				trans.value='All Star Break'
				transObj.push(trans);
			}
			
			//If this game has a month transition
			if(d[x].date.split('-')[1] != lastmonth){
				var trans=new Object();
				trans.type='month';
				trans.index=x;
				trans.value=parseInt(d[x].date.split('-')[1]);
				transObj.push(trans);
				lastmonth=d[x].date.split('-')[1];
			}
			
			//If this game indicates a different team
			if(d[x].team != lastteam){
				var trans=new Object();
				trans.type='team';
				trans.index=x;
				trans.value=d[x].team;
				transObj.push(trans);
				lastteam=d[x].team;
			}
		}
	},
	
	//The entry function to calculate the "higher stats" which need the "counting stats" to already be entered. 
	calcHigherStats:function(d){
		this.calcBA(d);
	},
	
	//Calculates AVG from the submitted stats object
	calcBA:function(d){
		//Check to make sure it has the needed data
		if(d.hasOwnProperty('H') && d.hasOwnProperty('AB')){
			d.AVG=(d.H/d.AB).toPrecision(3);
		}
		//If not, returns a message
		else{
			return "Not Enough Data To Calculate Batting Average";
		}
	},
	
	//Used to house info when a new "data presentation" in the center of the app is being created
	tempDataObj:function(){
		var tdo={
			games:[],
			streaks:[],
			teams:[],
			months:[],
			transitions:[],
			stats:new statsObj()
		}
		return tdo;
	},
	
	//takes data and puts it into a statsObj for standard display and presentation
	standardizeOrder:function(s,c){
		var clean=new statsObj();
		for(var x in s){
			try{clean[x]=s[x]}catch(err){alert(err.message)};
		}
		return clean;
	}
}


/*

Beyond the Scope of this project but an example of how it could expand. 

function sluggingPercentage(totalBases,atBats){
	return totalBases/atBats;
}

function ops(onBasePercentage,sluggingPercentage){
	return onbasePercentage+sluggingPercentage;
}

function isolatedPower(){
}

function onBaseSluggingPercentage(onBasePercentage,slugging){
	return onBasePercentage+slugging;
}

function homeRunsPerFlyBall(homeruns,flyball){
	return homeruns/flyball;
}

function strikeoutRate(strikeouts,plateAppearances){
	return strikeouts/plateAppearances;
}

function walkRate(){

}

function simpleRunsCreated(hits,baseOnBalls,totalBases,atBats){
	top=(hits+baseObBalls)*totalBases;
	bottom=atBats + baseOnBalls;
	return top/bottom;
}

function secondaryAverage(){

}

function plateAppearances(atBats,baseOnBalls,hitByPitch,sacHit,SacFlies){
	return atBats+baseOnBalls+hitByPitch+sacHit+SacFlies;
}



//Fielding
function totalChances(assists,putOuts,errors){
	return assists + putouts + errors;

}

*/
