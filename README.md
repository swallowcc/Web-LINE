Web-LINE
==============

![alt tag](https://cloud.githubusercontent.com/assets/1298784/7665406/912ee914-fbe7-11e4-85ec-7cc6f0ce0b09.png)

簡單來說，就是讓你可以用 Web 連上 LINE

可以幫助你在沒有 LINE 的平台上也能用 LINE

或是可以客製化自己的 LINE

Demo
------------

http://webline-chsien.rhcloud.com/

這是 public server，支援多人連線，但上限不確定能撐多少人

未加密的狀態下使用上可能會有安全性問題，建議使用分身帳號測試

Usage
------------
###Loal

```
npm install && bower install
```

```
grunt
```

瀏覽器開啟 `http://localhost:3000`

###Openshift

或是你也可以自己建立一台 Openshift Instance，直接 deploy 這個 repository

Feature
------------

* 帳號登入
* 取得聯絡人
* 取得最近訊息
* 接收與送出訊息

還有很多功能還沒實作，可以玩玩，歡迎 fork 及 pull request

感謝及聲明
------------
感謝 Purple-line 這個專案提供的 protocol 及說明

本專案僅可用於個人使用，不可用在商業用途

聯絡我：LeeChSien <chsienlee@gmail.com>
