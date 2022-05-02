
const cheerio = require('cheerio');
const puppeteer = require('puppeteer')
const request = require('request');

class meme_droid_scraper {

    static BASE_URLS = {
        english: 'https://memedroid.com',
        spanish: 'https://es.memedroid.com',
        portuguese: 'https://pt.memedroid.com',
        french: 'https://fr.memedroid.com',
        italian: 'https://it.memedroid.com'
    }

    static ROUTES = {
        search:'/search?query=', // require query parameter.
        top:'/memes/top/', // require day/week/month/ever parameter.
        latest:'/memes/latest', // don't require parameter.
        random:'/memes/random', // don't require parameter.
        tag:'/memes/tag/' // require tag parameter.
    }

    static get_document( url ){
        return new Promise( function( resolve, reject ){
            request( url, function( err, res, body ){
                if ( !err && res.statusCode === 200 ) {
                    const _ = cheerio.load( body );
                    resolve( _ );
      
                } else {
                    reject( err );
                }
            } ); // request
        } ); // promise object
    }
    /*
       parameters { url:string }

       This method returns a promise where inside,
       is using a request library. Then if not error,
       converts body, to cheerio object and resolve it,
       else reject with error.
    */

    static async get_memes( url ){

        var base_url = url.slice( 0, 24 );

        if( url.indexOf('.') === 17 ){
            base_url = this.BASE_URLS.english;
        }

        // if index of point is ten , then
        // base url is same to english.
        // i do this for avoid errors.
        //
        // else i use method slice to get base url,
        // manually xd.
        //
        // i need base_url variable for complete 
        // the html route links. ( href )

        const $ = await this.get_document( url );

        if( !$ ) return { _message:'[404]! not found' };

        // get all memes info
        const memes = [];

        $('.item-aux-container').each( ( i, el ) => {

            const common_index = $(el).children()[1]; 

            // common children index between img and video
            // tags are children 1. ( example below )
            //
            // image child node path:
            //  item-aux-container => 
            //    [cn.0] -> ( header => ( h1 , ... ) ) ?// src prop is not found here. 
            //    [cn.1!] -> ( a.dyn-link => { img.grey-background! } )
            //
            // video child node path:
            //  item-aux-container => 
            //    [cn.0] -> ( header => ( h1 , ... ) ) ?// src prop is not found here. 
            //    [cn.1!] -> ( div.video-container => ( video => { source1!, source2! } , ... ) )
            
            const tags_node = $(el.next).children(); 

            // it's  "div.tags-container" , 
            // inside that has next things ( img, a.dyn-link.. )
            // img nodes are not cataloged tag, therefore;
            // i need to get only "a.dyn-link" tags.

            const tags = [];

            tags_node.each( ( ind, tag ) => {

                if( tag.name === 'a' ){

                    const tag_link = tag.attribs.href;
                    const tag_name = tag.children[0].data;

                    tags.push( [ tag_name , base_url+tag_link ] );

                }
                // if element is 'a' node, then push into this iterarion tag list.
            } );
            
            // when all tags are joined inside tag list,
            // push it into main tag list. This is because is
            // needed to separate by meme later.

            const href = common_index.attribs.href;
            const link = (
                href === undefined? 
                    ''
                    :
                    base_url+href
            );

            const media_tag = $(common_index).children()[0];
            // 'media_tag' could be both image and video node.
            // if statement will do the task of determining
            // the type of 'media_tag' variable

            var media = undefined;

            if( media_tag.name === 'video' ){

                media = {};
                const source_nodes = $(media_tag).children();

                source_nodes.each( ( ind, source ) => {

                    const source_format = source.attribs.type;
                    const source_link = source.attribs.src;
                    // source { attribs: ( src!, type! ) } doble bungou!

                    media[ source_format ] = source_link;
                } );

            } else {
                media = media_tag.attribs.src;
                // img { attribs: ( src! ) } bingo!
            }

            // if 'media_tag' is video node, then 'media' variable 
            // value will be an object with each of the source nodes 
            // properties , with 'type' as key and 'src' as value.

            // so, else if 'media_tag' is image node, 'media'
            // variable value contains only the src property
            // of this.

            memes.push({
                index_:i,
                link: link,
                media,
                tags
            });

        } );
        //

        return memes;
    }
    /*
       parameters { url:string }

       this method returns a meme list based on 
       query parameter.

       properties by each one of elements:
       { index_:integer, link:string, media:String, tags:string[] }
    */

    static async get_query_tags( query, language ){

        const url = this.BASE_URLS[ language ];
        // gets url based on language.

        const browser = await puppeteer.launch();
        // init puppeter browser.

        const page = await browser.newPage();
        // create new page.

        await page.goto( url );
        // the page is located in the previous url address.

        try{
            await page.type('input[name=query]', query);
            // now inside input where name property
            // is 'query', type query parameter.
            // puppeteer 
        } catch ( err ) {
            return { tags:[] };
        }

        /*
            puppeteer takes care of interacting with the page, 
            as if it were a user.
            So it allows you to write in interoperable elements,
            such as 'input'.
        */

        var tag_selector = undefined;

        const set_tag_selector = async () => {

            const html =
                await page.evaluate( () => {
                    return document.documentElement.outerHTML;
                } )
            ;
            // so, first of all, gets html from page WHERE
            // input is modified, then items are avaiable now.

            const $ = cheerio.load( html );
            // then whit that html, use cheerio to make my life easier,
            // and convert into cheerio document. 

            tag_selector = $('a.search-form-autocomplete-result-link');
            // so selects 'a.search-form-autocomplete-result-link' which
            // has the TAGS that i'm looking for.

        }
        // declares 'tags_selector' and 'set_tag_selector'
        // to change tag_selector value like a react useState hook.

        try {
            await page.waitForSelector(
                'a.search-form-autocomplete-result-link'
            ).then( set_tag_selector );
            // waits for selector passed as argument and
            // executes set_tag_selector callback when
            // is founded.
        } catch( err ) {
            return { query, tags:[ 0 ] };
        }  

        const tags = [];

        tag_selector.each( (i, tag) =>  {
            
            const tag_href = tag.attribs.href;
            const tag_value = tag.children[0].data;

            if (tag_href.indexOf('/memes/tag/') !== -1) {

                tags.push([tag_value, tag_href]);

            }

        } );
        // when 'tags_selector' has already tags which
        // were waited, iterate for each one and push
        // into 'tags' array only if 'tag_href' is 
        // a meme tag.

        await page.close();
        // to finish close page.

        await browser.close();
        // and browser.

        return { query, tags };   
    }
    /*
        parameters { query:string , language:string }

        returns suggestion query tags.
        it's get items which are avaiable only,
        when type query input.
    */

}

module.exports = meme_droid_scraper;