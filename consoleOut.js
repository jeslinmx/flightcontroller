module.exports = function(){
  function init() {
    // get = getter;
    // setInterval(function(){
    //   var temp = get();
    //   if (previous == temp) counter++;
    //   else {
    //     console.log(counter);
    //     counter = 0;
    //   }
    //   previous = temp
    // }, 5);
    return this;
  }
  function receiveCallback(data) {
    console.log(data);
  }
  var previous = [0,0,0];
  var counter = 0;
  
  return {
    init: init,
    receiveCallback: receiveCallback
  };
}();