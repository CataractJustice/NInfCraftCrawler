const savedEntries = require('./save.json');
const fs = require('fs')

class Entry 
{
	constructor(word, emoji, isNew) 
	{
		this.word = word;
		this.checkedUpTo = 0;
		this.recipies = [];
		this.isNew = isNew;
		this.emoji = emoji;
	}

	addRecipie(firstWord, secondWord) 
	{
		this.recipies.push({firstWord, secondWord});
	}
}

const failedFetches = savedEntries.failed;
const knownEntries = [];
for(const e of savedEntries.entries) 
{
	const entry = new Entry(e.word, e.emoji, e.isNew);
	knownEntries.push(entry);
	entry.checkedUpTo = e.checkedUpTo;
	for(const r of e.recipies) 
	{
		entry.addRecipie(r.firstWord, f.secondWord);
	}
}
const knownTable = savedEntries.entriesMap;


function fetchAndRecord(entryIndexA, entryIndexB) 
{
	const firstWord = knownEntries[entryIndexA].word;
	const secondWord = knownEntries[entryIndexB].word;
	
	return fetch(`https://neal.fun/api/infinite-craft/pair?first=${firstWord}&second=${secondWord}`,
	{
		"method": "GET",
		"hostname": "neal.fun",
		"UserAgent": "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
		headers: {
			"Accept": "*/*",
			"Accept-Language": "en-GB,en;q=0.5",
			"Accept-Encoding": "gzip, deflate, br",
			"Referer": "https://neal.fun/infinite-craft/",
			"Sec-Fetch-Dest": "empty",
			"Sec-Fetch-Mode": "cors",
			"Sec-Fetch-Site": "same-origin",
			"TE": "trailers"
		},
	}
	).then((res) => {
		res.text().then((text) => 
		{
			let jsonResponce;
			try 
			{
				jsonResponce = JSON.parse(text);
			}
			catch (err) 
			{
				console.error(`Failed to fetch recipie of ${firstWord} + ${secondWord}, responce: ${text}`);
				failedFetches.push({firstWord, secondWord});
				return;
			}
			const result = jsonResponce.result;
			const emoji = jsonResponce.emoji;
			const isNew = jsonResponce.isNew;
			const entryIndex = knownTable[result];
			if(typeof entryIndex === "undefined") 
			{
				const newEntry = new Entry(result, emoji, isNew);
				newEntry.addRecipie(firstWord, secondWord);
				knownTable[result] = knownEntries.length;
				knownEntries.push(newEntry);
			}
			else 
			{
				knownEntries[entryIndex].addRecipie(firstWord, secondWord);
			}
			console.log(`${firstWord} + ${secondWord} = ${result}`);
		})
	});
}

const loopsCount = 1;
async function run() 
{
	for(let loopIndex = 0; loopIndex < loopsCount; loopIndex++) 
	{
		for(let entryIndexA = 0; entryIndexA < knownEntries.length; entryIndexA++) 
		{
			const entryA = knownEntries[entryIndexA];
			if(entryA.isNew) 
			{
				console.log(`Skipped new discovery ${entryA.word}`);
				continue;
			}
			while(entryA.checkedUpTo < knownEntries.length) 
			{
				if(!isNaN(parseInt(entryA.word)) && !isNaN(parseInt(knownEntries[entryIndexB].word))) 
				{
					console.log(`Skipped number recipie ${entryA.word} + ${knownEntries[entryIndexB].word}`);
					continue;
				}
				const entryIndexB = entryA.checkedUpTo;
				await fetchAndRecord(entryIndexA, entryIndexB).catch((err)=>{
					failedFetches.push({
						firstWord: knownEntries[entryIndexA].word,
						secondWord: knownEntries[entryIndexB].word
					});
					console.error(`Failed to fetch recipie ${knownEntries[entryIndexA].word} + ${knownEntries[entryIndexB].word}`);
				});
				await new Promise(resolve => setTimeout(resolve, 250 + parseInt(Math.random() * 500)));
				entryA.checkedUpTo++;
			}
		}
	}
	
	console.log(knownEntries);
	fs.writeFileSync("save.json", JSON.stringify({
		"entries": knownEntries,
		"entriesMap": knownTable,
		"failed": failedFetches
	}));
}


run();
