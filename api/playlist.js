const { Innertube, UniversalCache } = require('youtubei.js');

let ytClient = null;

export default async function handler(req, res) {
    // Enable CORS for local testing (Vercel uses same-origin in production, but this is safe)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const urlParam = req.query.url;
        if (!urlParam) {
            return res.status(400).json({ error: 'Playlist URL is required' });
        }

        // Initialize youtubei client if not already done (re-uses across warm lambda invocations)
        if (!ytClient) {
            ytClient = await Innertube.create({ cache: new UniversalCache(false) });
        }

        // Extract list ID from URL
        let listId = '';
        try {
            const urlObj = new URL(urlParam);
            listId = urlObj.searchParams.get('list');
        } catch (e) {
            // fallback if they just pass the ID
            listId = urlParam;
        }

        if (!listId) {
            return res.status(400).json({ error: 'Invalid YouTube playlist URL' });
        }

        // Fetch using the Music client for better data parsing on music playlists
        const playlist = await ytClient.music.getPlaylist(listId);
        
        if (!playlist || !playlist.items) {
             return res.status(404).json({ error: 'Playlist not found or empty' });
        }

        const tracks = playlist.items.map(item => {
            // Support both MusicResponsiveListItem and standard PlaylistVideo
            const id = item.id;
            const title = item.title ? (typeof item.title === 'string' ? item.title : item.title.toString()) : 'Unknown Title';
            let artist = 'Unknown Artist';
            if (item.authors && item.authors.length > 0) {
                 artist = item.authors.map(a => a.name).join(', ');
            } else if (item.author) {
                 artist = typeof item.author === 'string' ? item.author : item.author.name;
            }
            
            const thumbnail = item.thumbnails && item.thumbnails.length > 0 
                ? item.thumbnails[0].url 
                : '';
                
            const duration = item.duration?.seconds || 0;

            return { id, title, artist, thumbnail, duration };
        }).filter(track => track.id); // ensure valid tracks

        res.status(200).json({
            title: playlist.header?.title?.toString() || 'Streamify Playlist',
            author: playlist.header?.author?.name || '',
            tracks: tracks
        });
    } catch (error) {
        console.error('Error fetching playlist:', error.stack || error);
        res.status(500).json({ error: 'Failed to fetch playlist. Ensure the playlist is public.' });
    }
}
