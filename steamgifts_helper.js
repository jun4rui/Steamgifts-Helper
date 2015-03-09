// ==UserScript==
// @name       Steam Gifts Helper
// @namespace  http://fsh.jun4rui.me
// @version    3.5.3
// @description  steamgifts helper，steamgifts网站助手：功能是一键参加抽奖，3.1版对内核进行大幅修改，将原来的新开窗口方式改为内部队列方式，从此不必新开窗口，点击的抽奖可在后台排队逐一参加，下方会有游戏图标队列提示。
// @match      http://www.steamgifts.com/*
// @copyright  2013-2015, jun4rui
// @change log 3.5.3修复Entries超过1000后统计错误的问题
// ==/UserScript==
//定义CSS样式函数
function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}
addGlobalStyle(".gameListUnit {height:50px; margin:5px; border:1px solid; border-radius: 2px; border:1px solid #d2d6e0; padding:2px;}");	//下方队列单元样式
addGlobalStyle(".gameListUnit:first-child {border:1px solid #DB785E; padding:2px; background:#D99393}");	//第一个下方队列单元样式
addGlobalStyle(".addEnterButton {color: #FFFFFF;background: #D33434;text-shadow: 0 0 0;cursor: pointer;}");	//自动加入按钮样式
addGlobalStyle("#SGH_gameList {position: fixed;  bottom: 0;  left: 0;  width: 100%;  background: #2E3641;  z-index: 999999999999; box-shadow: 0px -1px 5px #333;}");	//底部栏样式
addGlobalStyle("#autoEnterFrame	{width:100%;height:0px;position:fixed;top:0;left:0;}");	//隐藏的参加Iframe样式
addGlobalStyle("#gameListPanel {width:100%;width:100%; z-index:9999999999; box-shadow: 0px 1px 5px #333;background-color: #6A7A84;}");
addGlobalStyle(".gameGiftBox {width:10%; display: inline-block;box-sizing: border-box;padding:2px 4px;}");
addGlobalStyle(".gameGiftUnit {width:100%;height:50px; border:1px solid #CACACA;position:relative;  box-shadow: 1px 1px 0px #555;cursor:pointer;}");
addGlobalStyle(".gameGiftUnit:hover {border:1px solid #F00;}");
addGlobalStyle(".gameGiftUnit>.mask {width:100%;height:14px; background:rgba(51, 51, 51, 0.7);position:absolute;bottom:0;left:0;z-index:2}");
addGlobalStyle(".gameGiftUnit>.name {width:100%;height:14px; line-height:14px;;position:absolute;bottom:0;left:0;z-index:3;text-align:left;color:#FFF;text-shadow: 1px 1px 2px #E8E8E8;overflow:hidden;}");
addGlobalStyle(".gameGiftUnit>.tag {width:100%;height:14px; line-height:14px;;position:absolute;top:0;left:0;z-index:3;text-align:right;color:#FFF;text-shadow: 1px 1px 2px #E8E8E8;}");

//更新（待自动Enter）游戏列表函数
function updateGameList(){
    var tempGameList	= JSON.parse(localStorage.SGH_gameList);
    //更新显示当前队列
    $('#SGH_gameList').html('');	//Clear content.
    var tempHtmlStr	= '';
    for (var i in tempGameList){
        tempHtmlStr	+= '<img src="'+tempGameList[i].pic+'" class="gameListUnit">';
    }
    $('#SGH_gameList').html(tempHtmlStr);
}

//获取点数函数
function getPointer(){
    $.get('http://www.steamgifts.com/about/faq',function(result){
        var pointNum	= $(result).find('.nav__points').text();
        console.log('当前点数: ',pointNum);
        localStorage.pointNum	= pointNum;
        $('.nav__points').text(localStorage.pointNum);
    });
}

//没有就初始化SGH_gameList
//保存自动Enter的游戏列表用
if (typeof(localStorage.SGH_gameList)=='undefined'){
    localStorage.SGH_gameList	= "[]";
}
//给每个Enter Unit加上一键进入的按钮
//var onClickEnterStr	= '<div><a href="[link]#OneClickEnter#AutoClose" target="_blank" style="color:#D32CD1;"><i class="fa fa-magic">&nbsp;Enter</a></div><div class="addEnterButton" glink="[glink]#OneClickEnter" gpic="[gpic]">Add</div>';
var onClickEnterStr	= '<div class="addEnterButton" glink="[glink]#OneClickEnter" gpic="[gpic]"><i class="fa fa-magic">&nbsp;参加</div>';
$('.giveaway__row-outer-wrap').each(function(){
    var tempHref	= $(this).find('.giveaway__heading a').attr('href');
    var tempPic		= $(this).find(".global__image-inner-wrap").eq(1).css("background-image");
    //因为SG网站有时候图片会挂掉，导致脚本出错无法自行下去，所以针对这种情况这里做容错处理
    if (typeof(tempPic)!='undefined'){
        tempPic	= tempPic.replace(/\"/g,"").slice(4,-1);
    }
    //console.log(tempHref);
    $(this).find('.giveaway__columns').append(onClickEnterStr.replace('[link]',tempHref).replace('[glink]',tempHref).replace('[gpic]',tempPic));
});

//在#OneClickEnter页面中的处理
if (location.href.indexOf("#OneClickEnter") != -1) {
    //每隔3秒检查一次按钮情况
    setInterval(function(){
        //如果有地址栏有#OneClickEnter标志，则自动点击Enter Giceway按钮
        if ($(".sidebar__entry-insert").is(':visible')) {
            $(".sidebar__entry-insert").get(0).click();
        } else {
            if (location.href.indexOf("#AutoClose")!=-1){
                //如果没有按钮，则关闭窗口
                window.opener = null;
                window.open("", "_self");
                window.close()
            }
            //将本页面从SGH_gameList中删除
            var tempGameList	= JSON.parse(localStorage.SGH_gameList);
            for (var i in tempGameList){
                //console.log(location.href,tempGameList[i].link.trim(),location.href.trim().indexOf(tempGameList[i].link.trim()));
                if (location.href.trim().indexOf(tempGameList[i].link.trim())!=-1){
                    //console.log("完成并删除: ",tempGameList[i].link,i);
                    tempGameList.splice(i,1);
                    //localStorage.SGH_gameList	= JSON.stringify(tempGameList.splice(i,1));
                    localStorage.SGH_gameList	= JSON.stringify(tempGameList);
                }
            }
        }
    },3000);
}

if (location.href=='http://www.steamgifts.com/' || location.href.indexOf('http://www.steamgifts.com/giveaways/')!=-1){
    //顶部增加用来不新开窗口就Enter用的Iframe
    $('body').prepend('<iframe id="autoEnterFrame" src=""></iframe>');
    $('body').prepend('<div id="SGH_gameList"></div>');
    $('.popup.popup--hide-games').after('<div id="gameListPanel"></div>');
    //添加按钮
    $('.nav__left-container').append('<div class="nav__button-container"><span class="nav__button full__load">全</span></div>');
    $('.nav__left-container').append('<div class="nav__button-container"><span class="nav__button wish__load">愿</span></div>');
    $('.nav__left-container').append('<div class="nav__button-container"><span class="nav__button sort__button sort" sort="gname" sortType="string">名</span></div>');
    $('.nav__left-container').append('<div class="nav__button-container"><span class="nav__button sort__button sort" sort="gpoint" sortType="int">点</span></div>');
    $('.nav__left-container').append('<div class="nav__button-container"><span class="nav__button sort__button sort" sort="genter" sortType="int">敌</span></div>');
    $('.nav__left-container').append('<div class="nav__button-container"><span class="nav__button"><input type="checkbox" id="zhui" style="width: 13px;vertical-align: middle;">追</span></div>');
}

// 点击addEnterButton按钮的操作
$('.addEnterButton').bind('click',function(){
    //把要自动Enter的gift链接加入到队列中
    var tempGameList	= JSON.parse(localStorage.SGH_gameList);
    tempGameList[tempGameList.length]	= {'link':$(this).attr('glink'),'pic':$(this).attr('gpic')};
    localStorage.SGH_gameList	= JSON.stringify(tempGameList);
    console.log('队列长度: ',localStorage.SGH_gameList.length);
    //更新待处理游戏列表
    updateGameList();
    //更新游戏点数
    getPointer();
});
// 【后台定时器】定时处理自动Enter的游戏队列
var processDelay	= 10000;
self.setInterval(function(){
    //更新点数
    getPointer();
    //载入单处理游戏Enter列表
    var tempGameList	= JSON.parse(localStorage.SGH_gameList);
    if (tempGameList.length>0)
        if (tempGameList.length>0)
            console.log("待处理数量：",tempGameList.length,"\n","当前列表:",tempGameList);
    //更新显示当前队列
    $('#SGH_gameList').html('');	//Clear content.
    var tempHtmlStr	= '';
    for (var i in tempGameList){
        tempHtmlStr	+= '<img src="'+tempGameList[i].pic+'" class="gameListUnit">';
    }
    $('#SGH_gameList').html(tempHtmlStr);
    //如果队列不为空，则从顶部开始处理
    if (tempGameList.length>0){
        console.log('Process:',tempGameList[0].link);
        $('#autoEnterFrame').attr({"src":tempGameList[0].link});
    }
},processDelay);

//获得列表的函数
function getGameList(inUrl) {
    console.log("Load:",inUrl);
    $.get(inUrl, function(HTMLData) {
        $(HTMLData).find(".giveaway__row-outer-wrap").each(function() {
            var gameName = $(this).find(".giveaway__heading a").text();
            var gameUrl = $(this).find(".giveaway__heading a").attr("href");
            var gamePic = $(this).find(".global__image-inner-wrap").eq(1).css("background-image");
            //因为SG网站有时候图片会挂掉，导致脚本出错无法自行下去，所以针对这种情况这里做容错处理
            if (typeof(gamePic)!='undefined'){
                gamePic	= gamePic.replace(/\"/g,"").slice(4,-1);
            }
            var enterNum = parseInt($(this).find(".giveaway__links span:eq(0)").text().slice(0,-8).replace(',',''));
            var enterPoint = parseInt($(this).find(".giveaway__heading__thin").text().slice(1,-2));
            //如果该抽奖是变淡的（即你参加过了或者没资格）则跳过
            if ($(this).find('.is-faded').length==1){
                //console.log('GameUrl:',gameUrl,'SKIP!');
            }else{
                //console.log(/*gameName,gameUrl,gamePic,*/enterNum,enterPoint);
                var tempHtmlStr	= '<div class="gameGiftBox"><div class="gameGiftUnit" style="background-image:url('+gamePic+');background-size:cover;" title="'+gameName+'" gname="'+gameName+'" genter="'+enterNum+'" gpoint="'+enterPoint+'" glink="'+gameUrl+'" gpic="'+gamePic+'"><div class="mask"></div><div class="tag">'+enterNum+'/'+enterPoint+'P</div><div class="name">'+gameName+'</div></div></div>';
                $('#gameListPanel').append(tempHtmlStr);
            }
        });
        //console.log($(HTMLData).find(".pagination__navigation a").eq($(HTMLData).find(".pagination__navigation a").length-2).text());
        //递归调用反复读取下一页，直到最后一页
        if ($(HTMLData).find(".pagination__navigation a").eq($(HTMLData).find(".pagination__navigation a").length-2).text().trim() == "Next") {
            getGameList('http://www.steamgifts.com'+$(HTMLData).find(".pagination__navigation a").eq($(HTMLData).find(".pagination__navigation a").length-2).attr("href"));
            //console.log('[FIND]'+$(HTMLData).find(".pagination__navigation a").eq($(HTMLData).find(".pagination__navigation a").length-2).attr("href"));
        }
    });
    return true
};
//排序函数a
function asort(a,b){
    if (a[1]<b[1])
        return 1;
    if (a[1]==b[1])
        return 0;
    if (a[1]>b[1])
        return -1;
}
//排序函数b
function sort(a,b){
    if (a[1]<b[1])
        return -1;
    if (a[1]==b[1])
        return 0;
    if (a[1]>b[1])
        return 1;
}

//小单元排序函数
function unitSort(inMethod,inType){
    var tempList	= new Array();
    $('.gameGiftUnit').each(function(){
        if (inType=="string")
            tempList.push(new Array( $(this).attr('glink'),$(this).attr(inMethod)));
        if (inType=="int")
            tempList.push(new Array( $(this).attr('glink'),parseInt($(this).attr(inMethod),10) ));
    });
    console.log(tempList);
    for(var i in tempList.sort(sort)){
        var tempDOM	= $(".gameGiftUnit[glink='"+tempList[i][0]+"']").eq(0).parent().clone();
        $(".gameGiftUnit[glink='"+tempList[i][0]+"']").eq(0).parent().remove();
        $('#gameListPanel').append(tempDOM);
    }
}

$('.full__load').bind('click',function(){
    $('#gameListPanel').html('');
    getGameList("http://www.steamgifts.com/giveaways/search?page=1");
});
$('.wish__load').bind('click',function(){
    $('#gameListPanel').html('');
    getGameList("http://www.steamgifts.com/giveaways/search?type=wishlist");
});

//列表图标点击行为
$(document).delegate('.gameGiftUnit', 'click', function() {
    //把要自动Enter的gift链接加入到队列中
    var tempGameList	= JSON.parse(localStorage.SGH_gameList);
    tempGameList[tempGameList.length]	= {'link':$(this).attr('glink')+'#OneClickEnter','pic':$(this).attr('gpic')};
    localStorage.SGH_gameList	= JSON.stringify(tempGameList);
    //更新待处理游戏列表
    updateGameList();
    //更新游戏点数
    getPointer();
    $(this).animate({'width':'0'},function(){
        $(this).parent().remove();
    });
});

//排序按钮点击行为
$(document).delegate('.sort__button','click',function(){
    unitSort($(this).attr('sort'),$(this).attr('sortType'));
    console.log('Click:',$(this).attr('sort'));
});


//“追”功能的定时器：每隔10分钟扫描一次愿望单，发现有游戏则统统自动参加
//TODO: 有些页面是没有check复选框的，记得要只在有这个的情况下处理
self.setInterval(function(){
    //如果“追”功能被勾选上才执行
    if (document.getElementById("zhui").checked){
        //console.log('检查愿望单');
        //找愿望单中可以参加的游戏
        $.get('http://www.steamgifts.com/giveaways/search?type=wishlist', function(HTMLData) {
            $(HTMLData).find(".giveaway__row-outer-wrap").each(function() {
                var gameUrl = $(this).find(".giveaway__heading a").attr("href");
                var gamePic = $(this).find(".global__image-inner-wrap").eq(1).css("background-image");
                //因为SG网站有时候图片会挂掉，导致脚本出错无法自行下去，所以针对这种情况这里做容错处理
                if (typeof(gamePic)!='undefined'){
                    gamePic	= gamePic.replace(/\"/g,"").slice(4,-1);
                }
                //如果该抽奖是变淡的（即你参加过了或者没资格）则跳过
                if ($(this).find('.is-faded').length==1){
                    //console.log('GameUrl:',gameUrl,'SKIP!');
                }else{
                    //丢到待处理队列去
                    //TODO: 下次添加到队列中的时候先检查一下队列里面是否有这个玩意
                    //console.log("找到新的愿望单游戏: ",gameUrl);
                    var tempGameList	= JSON.parse(localStorage.SGH_gameList);
                    tempGameList[tempGameList.length]	= {'link':gameUrl+'#OneClickEnter','pic':gamePic};
                    localStorage.SGH_gameList	= JSON.stringify(tempGameList);
                }
            });
        });

    }
},60000);
