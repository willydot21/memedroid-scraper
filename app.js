
require('dotenv').config({
    path:__dirname+'/.env'
})

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

app.use(cors());

app.use( '/memes', require('./routes/memes/main'));

app.use( ( req, res, next ) => {
    res.status( 404 ).end();
} );

app.listen( port , () => {
    console.log( `listen at ${ port }!` );
} );