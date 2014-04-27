module.exports = function(){
  var get = null;
  function init(getter) {
    get = getter;
    setInterval(function(){
      var temp = get();
      if (previous == temp) counter++;
      else {
        console.log(counter);
        counter = 0;
      }
      previous = temp
    }, 5);
  }
  var previous = [0,0,0];
  var counter = 0;
  
  return {
    init: init
  };
}();