// ==UserScript==
// @name         Quora Answers Compiler
// @namespace    http://tampermonkey.net/
// @version      0.1b
// @description  This script is designed to go through your profile and save all your answers.
// @author       Louis Vaught
// @match        https://www.quora.com/profile/*
// @copyright    2017, Louis Vaught
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

//Flag to control debugging output
var debugFlag = true;

//Tells the user that parsing is complete
function scriptDone () {
    alert('Script is done parsing answers. Check the answer document!');
}

//Function to scrape the answer links from the profile page and then do other stuff.
function parseAnswers () {
    //Get username. Process separated for readability.
    var currURL=$(location).attr('href');
    var match = /\/profile\/(.+)/.exec(currURL);
    var userName = match[1];

    //Find all the question links and turn them into URL's
    var answerURLs = [];
    $(".question_link").each(function() {
        //For some reason the question_link object is an array of size 1
        //console.log($(this)[0].href+"/answer/"+userName);
        answerURLs.push($(this)[0].href+"/answer/"+userName);
    });
    var urlNum = 0;
    var masterAnswerFound = false;
    var masterAnswerStarted = false;
    var childFlaggedString;
    //Listen for different messages
    window.addEventListener("message", function grabAnswer(recvMessage){
        //If your message is a creation event, then create the right thing.
        if(recvMessage.data === "Question loaded.") {
            if(!masterAnswerFound) {
                masterAnswer.postMessage("startMasterAnswer",'https://www.quora.com/');
                if(debugFlag) console.log("DEBUG: URL "+(urlNum)+" - master initialized");
            } else {
                childAnswer.postMessage("startChildAnswer",'https://www.quora.com/');
                if(debugFlag) console.log("DEBUG: URL "+(urlNum)+" - child initialized");
            }
        } else if (recvMessage.data === "Child has been parsed.") {
            //Now that our child string has been parsed, close the child answer and open a new one
            if(debugFlag) console.log("DEBUG: URL "+(urlNum)+" - master parsed child string succesfully");
            childAnswer.close();
            urlNum++;
            if (urlNum<answerURLs.length) {
                childAnswer = window.open(answerURLs[urlNum]);
            } else {scriptDone();}
        }
        //Check that it's a successful response. If it has failed, then close that window and open the next one
        else if (recvMessage.data === "I have failed you, master.") {
            //If we are searching for a master answer, open a new master.
            if (!masterAnswerFound) {
                if(debugFlag) console.log("DEBUG: URL "+(urlNum)+" - failed master match");
                masterAnswer.close();
                urlNum++;
                if (urlNum<answerURLs.length) {
                    masterAnswer = window.open(answerURLs[urlNum]);
                } else {scriptDone();}
            } else {
                //If we are searching for a child answer, increment that.
                if(debugFlag) console.log("DEBUG: URL "+(urlNum)+" - failed child match");
                childAnswer.close();
                urlNum++;
                if (urlNum<answerURLs.length) {
                    childAnswer = window.open(answerURLs[urlNum]);
                } else {scriptDone();}
            }
        } else { //If the response is successful, then cycle through windows
            if (!masterAnswerFound) {
                //If this is a successful master answer, then open a child window
                if(debugFlag) console.log("DEBUG: URL "+urlNum+" - successful master match");
                masterAnswerFound = true;
                urlNum++;
                if (urlNum<answerURLs.length) {
                    childAnswer = window.open(answerURLs[urlNum]);
                } else {scriptDone();}
            } else {
                //If this is a successful child window, forward the message onto the master answer
                if(debugFlag) console.log("DEBUG: URL "+urlNum+" - child object string forwarded to master");
                childFlaggedString="childString: "+recvMessage.data;
                masterAnswer.postMessage(childFlaggedString,'https://www.quora.com/');
            }
        }
    }, false);

    //Open the first user answer to start the loop.
    masterAnswer = window.open(answerURLs[0]);
    window.focus();
    //Initiate childAnswer to prevent weird errors
    childAnswer = masterAnswer;
    //Listen for a message indicating the window is open


}

//This function starts when the page is fully loaded.
$(document).ready(function() {
    //Pop up a button to start use of the script.
    $('body').append('<input type="button" value="Compile Answers" id="startButton">');
    $("#startButton").css("position", "fixed").css("top",100).css("left",10);
    if(debugFlag) console.log("DEBUG: Scrolling button recieved successfully!");

    var scrollCount = 0;

    //When the button is clicked, start scrolling to the last answer
    //If the loading spinner does exist, then loop the scrolling.
    //Operates on the fact that "spinner_display_area" changes to "spinner_display_area.hidden" when the last answer is reached.
    $("#startButton").on("click",function scrollLoop() {
        setTimeout(function () {
            var catchErr=false;
            $("html, body").animate({scrollTop: $(document).height()-$(window).height()});
            //See if the thing still exists
            try {
                var spinnerLoc = $(".spinner_display_area.hidden").position();
                if(debugFlag) console.log("DEBUG: Hidden spinner found at "+spinnerLoc.top+". Bottom of page is "+$(document).height()+".");
            }
            catch(err) {
                catchErr=true;
            }
            finally {
                scrollCount++;
                if(catchErr) {
                    scrollLoop();
                }
                else {
                    if(debugFlag) console.log("DEBUG: Scrolling script tried scrolling "+scrollCount+" times.");
                    parseAnswers();
                }
            }
        },1000);
    });
});