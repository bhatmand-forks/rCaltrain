!function(){"use strict";function t(t){return"undefined"!=typeof t}function e(){$.cookie("from",w.getText()),$.cookie("to",y.getText()),$.cookie("when",$(".when-button.selected").val())}function n(){$.cookie.defaults.expires=365,$.cookie.defaults.path="/",t($.cookie("from"))&&w.setText($.cookie("from")),t($.cookie("to"))&&y.setText($.cookie("to")),t($.cookie("when"))&&$('.when-button[value="'+$.cookie("when")+'"]').addClass("selected")}function r(){var t=new Date;return 60*t.getHours()*60+60*t.getMinutes()+t.getSeconds()}function o(){var t=new Date;return parseInt([t.getFullYear(),t.getMonth()+1,t.getDate()].map(function(t){return t.toString().rjust(2,"0")}).join(""))}function a(t){var e=Math.floor(t/60);return[Math.floor(e/60),e%60].map(function(t){return t.toString().rjust(2,"0")}).join(":")}function i(t,e){return Math.round((e-t)/60)}function c(){return"now"===$(".when-button.selected").val()}function u(t,e){var n=o(),r=$(".when-button.selected").val(),a=r;if("now"===a)switch(((new Date).getDay()+6)%7){case 5:a="saturday";break;case 6:a="sunday";break;case 0:case 1:case 2:case 3:case 4:a="weekday";break;default:return console.error("Unknown current day",((new Date).getDay()+6)%7),[]}var i=Object.keys(t).filter(function(e){var r=t[e];return r.start_date<=n&&n<=r.end_date}).filter(function(e){return t[e][a]});return"now"===r&&(i=i.filter(function(t){return!(t in e)||0===e[t].filter(function(t){return t[0]===n&&2===t[1]}).length}).concat(Object.keys(e).filter(function(t){return 0!==e[t].filter(function(t){return t[0]===n&&1===t[1]}).length}))),0===i.length&&console.log("Can't get service for now."),i}function s(e,n,r){var o={};return u(n,r).forEach(function(n){Object.keys(e).forEach(function(r){var a=e[r],i=a[n];t(i)&&(t(o[r])||(o[r]={}),Object.extend(o[r],i))})}),o}function f(t,e){return e.map(function(e){return t.indexOf(e)}).filter(function(t){return t!=-1})}function l(t,e){return t.departure_time-e.departure_time}function p(e,n,o){var a=[];return Object.keys(e).forEach(function(i){var u=e[i];Object.keys(u).forEach(function(e){var i=u[e],s=i.map(function(t){return t[0]}),l=f(s,n),p=f(s,o);if(t(l)&&t(p)&&0!==l.length&&0!==p.length){var d=Math.min.apply(this,l),h=Math.max.apply(this,p);d>=h||(!c()||i[d][1]>r())&&a.push({departure_time:i[d][1],arrival_time:i[h][1]})}})}),a.sort(l)}function d(e){var n=$("#info").empty();if(c()&&t(e)){var o=i(r(),e.departure_time);n.append('<div class="info">Next train: '+o+"min</div>")}}function h(t){var e=$("#result").empty();t.forEach(function(t){e.append('<div class="trip"><span class="departure">'+a(t.departure_time)+'</span><span class="duration">'+i(t.departure_time,t.arrival_time)+' min</span><span class="arrival">'+a(t.arrival_time)+"</span></div>")})}function v(){var n=x.stops,r=x.routes,o=x.calendar,a=x.calendar_dates,i=n[w.getText()],c=n[y.getText()],u=s(r,o,a);if(t(i)&&t(c)&&t(u)){var f=p(u,i,c);e(),d(f[0]),h(f)}}function g(){[w,y].forEach(function(t){t.on("focus",function(){t.setText(""),t.input.Show()}),t.on("change",v),t.on("complete",v)}),b.each(function(t,e){$(e).on("click",function(){b.each(function(t,e){$(e).removeClass("selected")}),$(e).addClass("selected"),v()})}),$("#reverse").on("click",function(){var t=w.getText();w.setText(y.getText()),y.setText(t),v()})}function m(){FastClick.attach(document.body),w=rComplete($("#from")[0],{placeholder:"Departure"}),y=rComplete($("#to")[0],{placeholder:"Destination"}),b=$(".when-button");var t=Object.keys(x.stops);w.setOptions(t),y.setOptions(t),n(),g(),v()}function k(t,e){var n={};return t.forEach(function(t){n[t]=!1}),function(t){n[t]=!0;var r=!0;for(var o in n)if(!n[o]){r=!1;break}r&&e()}}var w,y,b,x={};String.prototype.repeat=function(t){return t<=0?"":this+this.repeat(t-1)},String.prototype.rjust=function(t,e){return e=(e||" ").substr(0,1),e.repeat(t-this.length)+this},Object.extend=function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n]);return t};var j=["calendar","calendar_dates","stops","routes"],O=k(j,function(){$(m)});j.forEach(function(t){$.getJSON("data/"+t+".json",function(e){x[t]=e,O(t)})})}();