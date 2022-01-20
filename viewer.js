const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            `--window-size=1920,1080`,
        ]
    });

    const page = await browser.newPage();
    
    // goto sign in page
    
    //const cookies_path = './cookies.json';
    
    let not_login = true;

    //while(not_login){
        try{
            await page.goto('https://comic-fuz.com/account/signin',{
              waitUntil: 'networkidle0'
            });
            
            // type in account and passwd
            await page.type('input[type="email"]','leo891223@gmail.com');

            await page.type('input[type="password"]','ekids178');
            
            const login_btn = await page.$('button[class*="signin_form"]');
            await login_btn.evaluate(login_btn => login_btn.click());
            
            await Promise.all([ 
                page.waitForSelector('p[class*="signin_signin__description"]')
            ]);
            
            await page.screenshot({path: 'login_in.png',fullPage: true});
            
            console.log("here");
            not_login = false;
        } catch(e){
            console.log(e);
            not_login = true;
        }
    //}    

    // read lines
    
    var lines = fs.readFileSync('download_list.txt','utf-8').toString().split('\n');
    
    // write codes here

    var comic_path = 'D:/Picture/ComicFuz/';
    console.log(comic_path);
    // get into download path
    for(let i = 0;i < lines.length;i += 2){
        let magazine_type = lines[i].split('　')[0];
        let complete_path = comic_path + magazine_type + '/' + lines[i];
        
        if(fs.existsSync(complete_path)) continue;

        // if path is not exist
        // create path and download
        fs.mkdirSync(complete_path);

        let viewer_url = "https://comic-fuz.com/magazine/viewer/" + lines[i + 1];
        await page.goto(viewer_url,{
            waitUnitl: 'networkidle2'
        });
        
        //await page.waitForSelector('#__next > div > div.sc-iCoGMd.kMthTr > div');
        await page.waitForSelector('#__next > div > div[class*="sc-iCfMLu"] > div');

        // click page to show the slide bar
    
        let bar_page_exist = await page.$('#__next > div > div[class*="ViewerFooter_footer"] > p');
        
        while(bar_page_exist == null){
            await page.mouse.click(400,400);
            try{
                
                await page.waitForSelector('div[class*="ViewerFooter_footer"] > p',{timeout: 3000});

                bar_page_exist = await page.$('div[class*="ViewerFooter_footer"] > p');
            } catch(e) {
            }
        }

        //let bar_page_inner = await page.$eval('#__next > div > div.ViewerFooter_footer__3E55F > p',el => el.innerHTML.split(' '));
        let bar_page_inner = await page.$eval('div[class*="ViewerFooter_footer"] > p',el => el.innerHTML.split(' '));
        console.log(bar_page_inner[bar_page_inner.length - 1]);
        console.log(bar_page_inner[0]);
        let page_num = parseInt(bar_page_inner[bar_page_inner.length - 1],10);
        let page_now = parseInt(bar_page_inner[0],10);

        // move to first page
        for(let j = 0;j < page_now / 2;++j){
            await page.keyboard.press('ArrowRight');
        }
        
        let page_num_cnt = 1;

        // may need to add utility to go back to first page
        for(let j = 0;j < page_num / 2;++j){
            for(let k = 0;k < 2;++k){
                //let page_img = await page.$x('//img[@alt="page_' + String(j * 2 + k) + '"]');
                //let page_img_selector = '#__next > div > div > div > div:nth-child(' + String(page_num_cnt) + ') > div > div > img';
                let page_img_selector = 'img[alt="page_' + String(page_num_cnt - 1) + '"]';

                await page.waitForSelector(page_img_selector);

                let page_img = await page.$(page_img_selector);
                // wait until image is loaded
                
                let page_img_url = null;

                while(page_img_url == null){
                    try{
                        await page.waitForFunction('document.querySelector("img[alt=\'page_' + String(page_num_cnt - 1) + '\']").getAttribute("src") != null');
                        
                        //await page_img.screenshot({path:complete_path + "/" + String(j * 2 + k + 1) + ".png"});
                        // get the url of img
                        page_img_url = await page_img.evaluate(page_img => page_img.getAttribute('src'));
                        //console.log("lagged");
                    } catch(e){
                    }
                }
                
                console.log(page_num_cnt);
                //console.log(page_img_url);
                
                let imgTab = await browser.newPage();
                //await imgTab.setViewport({width: 1920,height: 1080});

                await imgTab.goto(page_img_url,{
                    waitUntil: 'networkidle2'
                });

                await imgTab.mouse.click(400,400);
                
                // download it
                let img_raw = await imgTab.$('body > img');
                await img_raw.screenshot({path: complete_path + "/" + String(j * 2 + k + 1) + ".png"});
                await imgTab.close();
                
                page_num_cnt += 1;
                //if(page_num_cnt == 2) break;
            }
            
            // next page
            await page.keyboard.press('ArrowLeft');
            //await page.mouse.click(25,400);

            if(page_num_cnt >= page_num - 2) break;
        }
        
    }
    //});
    await browser.close();
})();

