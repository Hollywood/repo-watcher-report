require('dotenv').config()
const fs = require('fs')
const path = require('path')
const Json2csvParser = require('json2csv').Parser;
const github = require('@octokit/rest')({
    //auth: 'token 1be6c560086bf8ffa6eb5ecdbd06bae45be21c6e',
    previews: [
        'hellcat-preview',
        'mercy-preview'
    ],
    //Set this to GHE API url if on GitHub Enterprise
    baseUrl: 'https://api.github.com'
})

github.authenticate({
    type: 'oauth',
    token: process.env.ghToken
})

require('./pagination')(github)

async function getRepoData() {
    var table = []
    const org = process.env.orgName
    
    //Get List of Repos and their sizes
    const repoResponse = [].concat.apply([],
        (await github.paginate(github.repos.listForOrg({org: org}))).map(n => n.data.map((n) => [n.name])))

    for (var i = 0, len = repoResponse.length; i < len; i++) {

        const watcherResponse = [].concat.apply([], (await github.paginate(github.activity.listWatchersForRepo({owner: org, repo: repoResponse[i][0]}))).map(n => n.data.map((n) => [n.login])))
        
        for (var j = 0, len1 = watcherResponse.length; j < len1; j++) {
            table.push({
                repo: repoResponse[i][0],
                watchers: watcherResponse[j][0]
            })
        }
    }

    //Write to CSV file
    var jsonResults = JSON.stringify(table)
    const fields = ['repo', 'watchers']
    var json2csvParser = new Json2csvParser({
        fields,
        delimiter: ';'
    })
    const csv = json2csvParser.parse(table)
    console.log(csv)
    fs.writeFile('repository-watcher-count.csv', csv, function (err) {
        if (err) throw err
        console.log('file saved!')
    })
}


getRepoData()
