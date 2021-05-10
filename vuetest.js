var app = new Vue({
    el: '#app',
    data: {
        message: '안녕하세요 Vue!'
    }
})

var date = new Date()
var app2 = new Vue({
    el: '#app-2',
    data: {
        message: '이 페이지는 ' + date + ' 에 로드 되었습니다'
    }
})
var example1 = new Vue({
el: '#example-1',
    data: {
        counter: 0
    }
})

var testData = {
        t1:"1" ,
        t2:"2" }

var example1 = new Vue({
el: '#testData',
    data: testData
})


  
