const readline = require('readline');

function create(prompt){
	return readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt
	});
}

function input(prompt){
	return new Promise((resolve) => {
		var rl = create(prompt);
		
		rl.on('line', (cmd) => {
			rl.close();
			resolve(cmd);
		});
		
		prompt && rl.prompt();
	});
}

function inkey(prompt){
	return new Promise(resolve => {
		var rl = create(prompt);
		
		process.stdin.once('keypress', (s, key)=>{
			rl.close();
			resolve(key);
		});
		prompt && rl.prompt();
	});
}


function *convertConfig(config){
	for(let item of config){
		let {label, accelerator} = item;
		yield [label.toLowerCase(), item];
		yield [accelerator.toLowerCase(), item];
	}
}

/**
 * @typedef {Array[4]|Array[3]|Array[2]} configitem
 * @params [label, accelerator, prompt, func]
 * @param {String} [0] - Метка в списке альтернатив
 * @param {String} [1] - Акслератор - принятая аббревиатура, которую можно ввести
 * @param {String} [2] - Приглашение ко вводу, показывающаяся перед списком альтернатив
 * @param {function} [3] - Функция, которая будет вызвана 
 * @params [label, accelerator, func]
 * @param {String} [0] - Метка в списке альтернатив, и она же - приглашение
 * @param {String} [1] - Акслератор - принятая аббревиатура, которую можно ввести
 * @param {function} [2] - Функция, которая будет вызвана 
 */

/**
 *
 */
function alternativeInput(config){
	let items = config.map(([label, accelerator, prompt, func])=>{
		if(!func){
			if(prompt){
				return {label, accelerator, prompt:label, func:prompt};
			}
			else{
				return {label, accelerator, prompt:label, func:accelerator};
			}
		}
		return {label, accelerator, prompt, func}
	});
	let mapping = new Map(convertConfig(items));
	//console.log(mapping.keys());
	return {
		input:async function(key){
			while(key){
				//console.log('key ' +key);
				this.last = key;
				
				let item = mapping.get(key.toLowerCase());
				
				//Если нет функции - просто вернуть значение
				if(!(item.func instanceof Function)){
					return item.func;
				}
				let prompt = item.prompt +'(' + items.filter((a)=>(a!==item)).map((a)=>(a.label)).join('|') + ')>';
				
				let entry = await input(prompt);
				//console.log('entry ' +entry);
				
				if(mapping.has(entry.toLowerCase())){
					//Если введён ключ - сменить режим и повторить
					key = entry;
				}
				else{
					//Если введено значение, пробросить её в функцию и вернуть то, что вернёт она
					if(item.func instanceof Function){
						try{
							return await item.func(entry);
						}
						catch(e){
							console.log('Error in function');
							console.log(e.stack);
						}
					}
					else{
						return item.func;
					}
				}
			}
		}
	}
}

module.exports = {
	input,
	inkey,
	alternativeInput
};