require('dotenv').config()
const fs = require('fs')
const path = require('path')
const Json2csvParser = require('json2csv').Parser;
const octokit = require('@octokit/rest')({
    auth: `token ${process.env.ghToken}`,
    //Set this to GHE API url if on GitHub Enterprise
    baseUrl: 'https://api.github.com'
})

async function getRepoData() {
    var table = []
    const org = process.env.orgName


    //Get List of Repos and paginate
    const repoOptions = octokit.repos.listForOrg.endpoint.merge({
        org: org
    })
    
    const repoList = await octokit.paginate(repoOptions).then(repos => {
        return repos.map((n) => n.name)
    }).catch(error => { 
        fs.writeFile('repoErrors.txt', error)
    })
    
    //Loop through repos and pull watchers for each
    for (var i = 0, numRepos = repoList.length; i < numRepos; i++) {

        const watcherOptions = octokit.activity.listWatchersForRepo.endpoint.merge({
            owner: org,
            repo: repoList[i]
        })

        //Paginate through watchers endpoint to pull full array
        const watcherList = await octokit.paginate(watcherOptions).then((watchers) => {
            return watchers.map(n => n.login)
        }).catch(error => { 
            fs.writeFile('watcherErrors.txt', error)
        })
        
        //Add to our temp table for writing out to csv
        for (var j = 0, numWatchers = watcherList.length; j < numWatchers; j++) {
            table.push({
                repo: repoList[i],
                watchers: watcherList[j]
            })
        }
    }

    //Write table out to csv file
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
