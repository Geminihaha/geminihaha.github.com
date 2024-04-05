
function callListAct(){
    var data = 
    { 
        'name' : 'listData',
        //'data' : ['test', 'test2'],
        'data':'data',
        'callbackFunc' : 'callbackFunc'
    };
    window.appBridge.postMessage(JSON.stringify(data));
}

function callComposeMainAct(){
    var data = 
    { 
        'name' : 'composeMainAct',
        //'data' : ['test', 'test2'],
        'data':'data',
        'callbackFunc' : 'callbackFunc'
    };
    window.appBridge.postMessage(JSON.stringify(data));
}