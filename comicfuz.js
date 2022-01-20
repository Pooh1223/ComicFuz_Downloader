const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    fs.writeFile("download_list.txt","",function (err) {
        if(err) console.log(err);
    });

    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();
    
    // goto sign in page

    await page.goto('https://comic-fuz.com/account/signin',{
      waitUntil: 'networkidle2'
    });

    //console.log(await page.content());
    
    // type in account and passwd
    await page.type('input[type="email"]','leo891223@gmail.com');
    
    await page.type('input[type="password"]','ekids178');
    
    const login_btn = await page.$('button[class*="signin_form"]');
    await login_btn.evaluate(login_btn => login_btn.click());
    
    await Promise.all([ 
        page.waitForSelector('p[class*="signin_signin__description"]')
    ]);
    
    await page.screenshot({path: 'login_in.png',fullPage: true});
    
    // goto bookshelf page
    await page.goto('https://comic-fuz.com/bookshelf',{
      waitUntil: 'networkidle2'
    });

    await page.waitForSelector('div[class*="bookshelf_bookshelf"] > div > ul');

    // goto bookshelf 
    const gekkan = await page.$('div[class*="bookshelf_bookshelf"] > div > ul > label:nth-child(3)');
    await gekkan.evaluate(gekkan => gekkan.click());
    
    for(let i = 1;i <= 5;++i){
        // get series url postfix
        let series = await page.$eval('div[class*="bookshelf_bookshelf"] > section > div > a:nth-child(' + String(i) + ')',el => el.getAttribute('href'));

        let series_url = "https://comic-fuz.com" + series;
        
        // goto series i
        let newTab = await browser.newPage();
        await newTab.goto(series_url,{
          waitUntil: 'networkidle2'
        });

        
        let first_magazine = await newTab.$eval('div[class*="magazine_issue_detail_introduction__rightSection"] > h1',el => el.innerHTML);

        let magazine_name = first_magazine.split(' ')[0];

        //console.log(magazine_name);
        
        // get all listed magazine under certain series
        let series_magazine = await newTab.$$('div[class*="magazine_issue_detail_outerSection"] > div > div > section > div > div');

        for(let j = 1;j <= series_magazine.length;++j){
            let readable = await newTab.$eval('div[class*="magazine_issue_detail_outerSection"] > div > div > section > div > div:nth-child(' + String(j) + ') > div > div[class*="MagazineIssueDetail_magazineIssueDetail__rightSection"] > div > a',el => el.innerHTML);
            
            // if it is downloadable
            if(readable == "読む"){

                let title = await newTab.$eval('div[class*="magazine_issue_detail_outerSection"] > div > div > section > div > div:nth-child(' + String(j) + ') > div > div[class*="MagazineIssueDetail_magazineIssueDetail__rightSection"] > h2',el => el.innerHTML);
                //console.log(title);
                
                // write magazine title to download list txt
                fs.appendFile("download_list.txt",magazine_name + "　" + title + "\n",function(err){
                    if(err) console.log(err);
                });
                
                // click yomu to get the viewer url
                let viewerTab = await browser.newPage();
                await viewerTab.goto(series_url,{
                    waitUntil: 'networkidle2'
                });

                await viewerTab.$eval('div[class*="magazine_issue_detail_outerSection"] > div > div > section > div > div:nth-child(' + String(j) + ') > div > div[class*="MagazineIssueDetail_magazineIssueDetail__rightSection"] > h2',el => el.click());
                console.log(viewerTab.url());

                // write url to download list txt
                let magazine_url_split = viewerTab.url().split('/');
                let magazine_id = magazine_url_split[magazine_url_split.length - 1];
                fs.appendFile("download_list.txt",magazine_id + "\n",function(err){
                    if(err) console.lor(err);
                });

                viewerTab.close();
            }
        }

        await newTab.close();
    }

    //await browser.close();
})();

