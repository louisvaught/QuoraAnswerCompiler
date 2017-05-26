// ==UserScript==
// @name         Quora Compiler Helper
// @namespace    https://www.quora.com/
// @version      0.1b
// @description  This helper script injects code into the answer documents to move answer data between pages.
// @author       Louis Vaught
// @match        https://www.quora.com/*/answer/*
// @copyright    2017, Louis Vaught
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

//Flags to control debugging output
var debugMaster = true;
var debugChild = true;
var debugObject = false;
//Pre-define these to prevent falling out of scope
var childCount = 0;
var childString;
var titleString;
var authorString;
var answerString;
var answerPrefix;
var authorPrefix;
var returnstring;

function parseMessages(recvMessage){
    //If the message is to start a masterAnswer, do master initialization.
    if (recvMessage.data==="startMasterAnswer") {
        //Check that the page is valid and return the right code
        if (document.title==="Error 404 - Quora") {
            window.opener.postMessage("I have failed you, master.",'https://www.quora.com/');
            if(debugMaster) console.log("DEBUG: Master creation failed.");
        } else {
            $('body').append('<input type="button" value="Clean Formatting" id="cleanButton">');
            $("#cleanButton").css("position", "fixed").css("top",100).css("left",10);
            $("#cleanButton").on("click",function() {
                console.log("DEBUG: Formatting Cleaning Triggered.");
                //TODO: Add line breaks and whitespace.

                //Remove extra garbage:
                $(".Answer.ActionBar.Sticky").remove();
                $(".Answer.ActionBar").remove();
                $(".LoggedInSiteHeader.SiteHeader").remove();
                $(".TimelineWrapper").remove();
                $(".SimpleToggle.Toggle.QuestionRelatedAnswersToggle.toggle_fade_in").remove();
                $(".view_more").remove();
                console.log("DEBUG: Formatting Cleaning Completed.");
                $("#cleanButton").remove();
            });
            window.opener.postMessage("Master created successfully!",'https://www.quora.com/');
            if(debugMaster) console.log("DEBUG: Master creation successful.");
        }
        //If the message is a child start, then do child initialization.
    } else if (recvMessage.data==="startChildAnswer") {
        //Check that the page is valid
        if (document.title==="Error 404 - Quora") {
            window.opener.postMessage("I have failed you, master.",'https://www.quora.com/');
            if(debugChild) console.log("DEBUG: Child creation failed.");
        } else {
            if(debugChild) console.log("DEBUG: Child creation successful.");
            //If the page is valid, check if our answer objects look correct:
            if($(".Answer.AnswerPageAnswer.AnswerBase").length!==1) {
                if(debugChild) console.log("DEBUG: Child format not correct. Aborting!");
                window.opener.postMessage("I have failed you, master.",'https://www.quora.com/');
            } else {
                //Grab all the objects
                titleString=$(".ans_page_question_header").prop('outerHTML');
                authorString=$(".author_header").prop('outerHTML');
                answerString=$(".Answer.AnswerPageAnswer.AnswerBase").prop('outerHTML');
                //Now append the objects
                returnString = "-titleStringFlag-"+titleString+"-authorStringFlag-"+authorString+"-answerStringFlag-"+answerString;
                //Return the object string message
                if(debugChild) console.log("DEBUG: child returned answer string.");
                window.opener.postMessage(returnString,'https://www.quora.com/');
            }
        }
    } else {
        //If the message isn't a start message, check if it's a child HTML String:
        var childRegex = /childString: (.+)/;
        if(childRegex.test(recvMessage.data)) {
            //Parse message into various components:
            childCount++;
            childString = childRegex.exec(recvMessage.data);
            var answerRegex = /(.+)-answerStringFlag-(.+)/.exec(childString[1]);
            answerString = answerRegex[2];
            answerPrefix = answerRegex[1];
            var authorRegex = /(.+)-authorStringFlag-(.+)/.exec(answerPrefix);
            authorString = authorRegex[2];
            authorPrefix = answerRegex[1];
            var titleRegex =/-titleStringFlag-(.+)/.exec(authorPrefix);
            titleString = titleRegex[1];

            //Add parsed objects to the answer page.
            var answerUnString=$.parseHTML(answerString)[0];
            $(".view_more").after(answerUnString);
            var authorUnString=$.parseHTML(authorString)[0];
            $(".view_more").after(authorUnString);
            var titleUnString=$.parseHTML(titleString)[0];
            $(".view_more").after(titleUnString);

            //Add some page breaks for extra pretty:
            $(".view_more").after("<br>");
            $(".view_more").after("<br>");

            //Return success
            if(debugMaster) console.log("DEBUG: Master recieved child objects - "+childCount);
            window.opener.postMessage('Child has been parsed.','https://www.quora.com/');
        }
    }
}

//On document load, wait for communication from the parent
$(document).ready(function() {
    console.log("Noticed "+$(".Answer.AnswerPageAnswer.AnswerBase").length+" answers.");
    window.addEventListener("message", parseMessages, false);
    if(debugObject){
        //Pop up a button to start use of the script.
        $('body').append('<input type="button" value="Test Object String" id="objectButton">');
        $("#objectButton").css("position", "fixed").css("top",100).css("left",10);

        //When the button is clicked, start scrolling to the last answer
        //If the loading spinner does exist, then loop the scrolling.
        //Operates on the fact that "spinner_display_area" changes to "spinner_display_area.hidden" when the last answer is reached.
        $("#objectButton").on("click",function() {
            console.log("DEBUG: Object stringify button pressed.");
            //Find the objects:
            titleString=$(".ans_page_question_header").prop('outerHTML');
            authorString=$(".author_header").prop('outerHTML');
            answerString=$(".Answer.AnswerPageAnswer.AnswerBase").prop('outerHTML');
            //Test by appending the strings to the end of the answer:
            var answerUnString=$.parseHTML(answerString)[0];
            $(".view_more").after(answerUnString);
            var authorUnString=$.parseHTML(authorString)[0];
            $(".view_more").after(authorUnString);
            var titleUnString=$.parseHTML(titleString)[0];
            $(".view_more").after(titleUnString);
            //Remove extra garbage:
            $(".TimelineWrapper").remove();
            $(".SimpleToggle.Toggle.QuestionRelatedAnswersToggle.toggle_fade_in").remove();
            $(".view_more").remove();
            console.log("DEBUG: Stringify test was successful.");
        });
    } else {
        setTimeout(function(){window.opener.postMessage("Question loaded.",'https://www.quora.com/');},500);
    }
});