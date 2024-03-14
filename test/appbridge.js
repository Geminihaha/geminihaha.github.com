
function callListAct(){
    var data = 
    { 
        'name' : 'listData',
        data : ['test', 'test2'],
        callbackFunc : 'callbackFunc'
    };
    window.appBridge.postMessage(data.stringify)
}