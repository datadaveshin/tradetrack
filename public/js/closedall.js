
(function() {
  /**
  Will change the color of text in element by class to red/green based on price
  */
  function colorPrices(conditionClass, targetClass) {
    for(var i = 0, j = targetClass.length; i < j; ++i) {
      console.log(conditionClass[i].innerText);
      if (Number(conditionClass[i].innerText) > 0) {
        targetClass[i].style.color = "green";
      } else if (Number(conditionClass[i].innerText) < 0) {
        targetClass[i].style.color = "red";
      } else {
        targetClass[i].style.color = "black";
      }
    }
  }

  // Change the color of the $change and $change columns
  var maxDrawDown = document.getElementsByClassName("maxDrawDown");
  colorPrices(maxDrawDown, maxDrawDown);

  var maxPortfolioGain = document.getElementsByClassName("maxPortfolioGain");
  colorPrices(maxPortfolioGain, maxPortfolioGain);

  var totalGl = document.getElementsByClassName("totalGl");
  colorPrices(totalGl, totalGl);

  var totalGlPercent = document.getElementsByClassName("totalGlPercent");
  colorPrices(totalGlPercent, totalGlPercent);

  // var change = document.getElementsByClassName("class_glAmount");
  // colorPrices(change, change);
  // var change = document.getElementsByClassName("class_glAmount");
  // colorPrices(change, change);

  var change = document.getElementsByClassName("class_glAmount");
  var changeInPercent = document.getElementsByClassName("class_glInPercent");
  var glDollar = document.getElementsByClassName("class_FolioAmount");
  var glInPercent = document.getElementsByClassName("class_FolioAmountPercent");
  colorPrices(change, change);
  colorPrices(changeInPercent, changeInPercent);
  colorPrices(glInPercent, glDollar);
  colorPrices(glInPercent, glInPercent);


  // var change = document.getElementsByClassName("class_glAmount");
  // colorPrices(change, change);
  //
  // var changeInPercent = document.getElementsByClassName("class_glInPercent");
  // colorPrices(changeInPercent, changeInPercent);
  //
  // var glDollar = document.getElementsByClassName("class_FolioAmount");
  // colorPrices(glInPercent, glDollar);
  //
  // var glInPercent = document.getElementsByClassName("class_FolioAmountPercent");
  // colorPrices(glInPercent, glInPercent);

})();
