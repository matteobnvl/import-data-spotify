const {Client} = require('pg')

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'app',
    password: 'password',
    port: 5432
})

async function create() {
    try {
        console.log('Connection database')
        await client.connect()
        console.log('Connection database succesfull')
        await client.query(`
            CREATE TABLE IF NOT EXISTS "Artist" (
                "artist_uri" TEXT NOT NULL,
                "name" TEXT NOT NULL,
            
                CONSTRAINT "Artist_pkey" PRIMARY KEY ("artist_uri")
            );

            CREATE TABLE IF NOT EXISTS "Album" (
                "album_uri" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "artist_uri" TEXT NOT NULL,
            
                CONSTRAINT "Album_pkey" PRIMARY KEY ("album_uri")
            );

            CREATE TABLE IF NOT EXISTS "Music" (
                "track_uri" TEXT NOT NULL,
                "title" TEXT NOT NULL,
                "duration_ms" INTEGER NOT NULL,
                "album_uri" TEXT NOT NULL,
            
                CONSTRAINT "Music_pkey" PRIMARY KEY ("track_uri")
            );
            
            -- CreateTable
            CREATE TABLE IF NOT EXISTS "Playlist" (
                "playlist_id" SERIAL NOT NULL,
                "name" TEXT NOT NULL,
                "collaborative" BOOLEAN NOT NULL DEFAULT false,
                "modified_at" INTEGER NOT NULL,
                "num_followers" INTEGER,
                "num_edits" INTEGER,
                "num_albums" INTEGER NOT NULL,
                "num_tracks" INTEGER NOT NULL,
                "num_artists" INTEGER NOT NULL,
                "duration_ms" INTEGER NOT NULL,
            
                CONSTRAINT "Playlist_pkey" PRIMARY KEY ("playlist_id")
            );
            
            -- CreateTable
            CREATE TABLE IF NOT EXISTS "Music_Playlist" (
                "music_playlist_id" SERIAL NOT NULL,
                "playlist_id" INTEGER NOT NULL,
                "track_uri" TEXT NOT NULL,
                "pos" INTEGER NOT NULL,
            
                CONSTRAINT "Music_Playlist_pkey" PRIMARY KEY ("music_playlist_id")
            );
            -- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_artist_uri_fkey" FOREIGN KEY ("artist_uri") REFERENCES "Artist"("artist_uri") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Music" ADD CONSTRAINT "Music_album_uri_fkey" FOREIGN KEY ("album_uri") REFERENCES "Album"("album_uri") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Music_Playlist" ADD CONSTRAINT "Music_Playlist_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "Playlist"("playlist_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Music_Playlist" ADD CONSTRAINT "Music_Playlist_track_uri_fkey" FOREIGN KEY ("track_uri") REFERENCES "Music"("track_uri") ON DELETE RESTRICT ON UPDATE CASCADE
        `)

        console.log('Query terminated')

    } catch (err) {
        console.error(err)
    } finally {
        await client.end();
    }
}

create()

/*
-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_artist_uri_fkey" FOREIGN KEY ("artist_uri") REFERENCES "Artist"("artist_uri") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Music" ADD CONSTRAINT "Music_album_uri_fkey" FOREIGN KEY ("album_uri") REFERENCES "Album"("album_uri") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Music_Playlist" ADD CONSTRAINT "Music_Playlist_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "Playlist"("playlist_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Music_Playlist" ADD CONSTRAINT "Music_Playlist_track_uri_fkey" FOREIGN KEY ("track_uri") REFERENCES "Music"("track_uri") ON DELETE RESTRICT ON UPDATE CASCADE;
*/