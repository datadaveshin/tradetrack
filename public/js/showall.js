/**
* Call for resizing TC2000 charts
*/
$(function () {
  setIFrameSize();
  $(window).resize(function () {
    setIFrameSize();
  });
});

/**
Resizes the iframe for TC2000 charts
*/
function setIFrameSize() {
  var ogWidth = 700;
  var ogHeight = 600;
  var ogRatio = ogWidth / ogHeight;

  var windowWidth = $(window).width();
  if (windowWidth < 480) {
    var parentDivWidth = $(".iframe-class").parent().width();
    var newHeight = (parentDivWidth / ogRatio);
    $(".iframe-class").addClass("iframe-class-resize");
    $(".iframe-class-resize").css("width", parentDivWidth);
    $(".iframe-class-resize").css("height", newHeight);
  } else {
    $(".iframe-class").removeClass("iframe-class-resize");
  }
}
