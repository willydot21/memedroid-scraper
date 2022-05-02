
const express = require('express');
const router = express.Router();
const scraper = require('../../src/scraper-src/meme-droid-scraper');

async function send_content( route, req, res ){

    const language = req.params.language;

    // language is a OBLIGATORY parameter
    // because it's will condition the response
    // results. so memedroid page has more languages
    // besides english.

    const page = req.query.page || '1';

    // page is a additional query parameter ,
    // if you don't know how to read ( joke ) then 
    // this is added because , scraper don't recover all
    // the memes , returns only the first twenty.
    // by default page variable value will be 1.

    const search_query = req.query.search_query;

    // search_query is a query parameter which
    // is needed only into next routes.
    // /top , /search , /tag
    // 
    // ex: https://domain_name/memes/english/top?search_query=day

    const base_url = scraper.BASE_URLS[ language ];

    // example english base_url : https://memedroid.com

    const route_path = scraper.ROUTES[ route ];

    // route paths are next:
    //     /search , /top , /latest, /random, /tag

    var url = `${ base_url }${ route_path }` + ( search_query? `${ search_query }`:'' );

    if( !(['search', 'latest'].includes( route )) ){
        url += `/${ page }`; 
    }

    // url is defined here but , url is also conditioned by search_query
    // and page. i do this to avoid shit errors when search_query
    // not been defined or is not necessary in route.
    // so , only in cases that route value be 'search' or latest,
    // the url not add page.

    var content;

    // declares all needed variables ends.

    try{
        content = await scraper.get_memes( url );
        res.json( content ).end();
    }  
    catch( error ) {
        res.json( { error } ).end();
    }
}

router.get( '/:language/random', ( req, res ) => {

    send_content( 'random', req, res );

} );

router.get( '/:language/latest', ( req, res ) => {

    send_content( 'latest', req , res );

} );

router.get( '/:language/search', ( req, res ) => {

    send_content( 'search', req, res );

} );

router.get( '/:language/top', ( req, res ) => {

    send_content( 'top', req, res );

} );    

router.get( '/:language/tag', async( req, res ) => {

    send_content( 'tag', req, res );

} );

router.get( '/:language/search_tag', async( req, res ) => {

    const search_query = req.query.search_query;

    const language = req.params.language;

    const tags = await scraper.get_query_tags( search_query, language );

    res.json( tags );

} );

module.exports = router;