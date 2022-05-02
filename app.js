
const express = require('express');
const app = express();
const port = 3001;
const cors = require('cors');

app.use(cors());

app.use( '/memes', require('./routes/memes/main'));

app.use( ( req, res, next ) => {
    res.status( 404 ).end();
} );

app.listen( port , () => {
    console.log( `listen at ${ port }!` );
} );