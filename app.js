const http = require('http');
const fs = require('fs');

const DOWNLOAD_PATH = 'images/';

getUrl({
    idx:1,
    n:10
},(urls)=>{
    let successCouter = 0;
    let failCounter = 0;
    urls.forEach(function(item,i) {
        downloadImage(item,result=>{
            result ? successCouter++:failCounter++;
            if((successCouter+failCounter) == urls.length ){
                console.info(`totally ${successCouter} wallpapers downloaded successfully and ${failCounter} failed.`);
            }
        });
    }, this);
})

function getUrl(opt,cb){
    var url = `http://www.bing.com/HPImageArchive.aspx?format=js&idx=${opt.idx || 1}&n=${opt.n || 1}&nc=${Date.now()}&pid=hp`;

    http.get(url, (res) => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];

        let error;
        if (statusCode !== 200) {
          error = new Error('Request Failed.\n' +
                            `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
          error = new Error('Invalid content-type.\n' +
                            `Expected application/json but received ${contentType}`);
        }
        if (error) {
          console.error(error.message);
          // consume response data to free up memory
          res.resume();
          return;
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const d = JSON.parse(rawData);
            // console.log(d);
            if(d && d.images){
                var urls = d.images.map(item=>'http://www.bing.com'+item.url);
                cb && cb(urls);
            }
          } catch (e) {
            console.error(e.message);
          }
        });
      }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
      });
}

function downloadImage(url,cb){
    console.info(`downloading ${url}`);
    http.get(url,res=>{
        if(res.statusCode == 200){
            let raw = [];
            res.on('data',chunk=>{raw.push(chunk);});
            res.on('end',()=>{
                var data = Buffer.concat(raw);
                var filename = url.split('/').pop();
                fs.writeFileSync(DOWNLOAD_PATH+filename,data);
                console.info(`${filename} downloaded`);
                cb && cb(true);
            });
        }else{
            console.error('download images failed.');
            cb && cb(false);
        }
    });
}
