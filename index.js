require('dotenv').config();
const fetch = require('node-fetch');
const cTable = require('console.table');
const fs = require('fs');

if(process.env.API_KEY === undefined) {
    console.log('No api key provided. Check your .env file')
    return;
}

let now = new Date();
let month = now.getMonth();
let year = now.getFullYear();

const args = process.argv.slice(2);

if(args.length === undefined || args.length !== 2) {
    console.log(`Using default date ${month+1} ${year}`);
} else {
    let monthArg = args[0];
    let yearArg = args[1];

    if(monthArg > 0 && monthArg <= 12 && yearArg >= 2020) {
        console.log(`Using provided date ${monthArg} ${yearArg}`)
        month = monthArg - 1; // actual month data in js is 0 based
        year = yearArg;
    } else {
        console.log(`Dodgy date args provided. Using default date ${month+1} ${year}`);
        console.log("args need to be `node index.js 6 2020` (that'd be for June 2020 yeah)")
    }
}


fetch('https://api.iterable.com/api/campaigns', {
        method: 'get',
        headers: {
            'api-key': process.env.API_KEY,
        }
    })
    .then(response => response.json())
    .then(json => {
        
        let campaignSummary = json.campaigns
            .filter(campaign => {
                    let campaignDate = new Date(campaign.startAt);
                    let cMonth = campaignDate.getMonth();
                    let cYear = campaignDate.getFullYear();
        
                    if(cMonth == month && cYear == year) // intentionally ==
                        return true;
            })
            .map(campaign => {
                return {
                    name: campaign.name,
                    sendSize: campaign.sendSize,
                    medium: campaign.messageMedium,
                    listIds: campaign.listIds.join(),
                    date: new Date(campaign.startAt)
                };
            });

            const table = cTable.getTable(campaignSummary.sort((a,b) => a.date > b.date ? 1 : -1));

            const fileName = "campaigns.csv";

            if(fs.existsSync(fileName)) {
                // delete the existing file, upon deleting, write the new file out :-) 
                fs.unlinkSync(fileName, () => {
                });
            }

            fs.writeFile(fileName, table, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            }); 

    });


