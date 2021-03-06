var poemgen = {};

poemgen.createPoem = function(data) {

  window.ddd = data;
  var s = ""
  var thismem = _.sample(data.memories)
  console.log(thismem);

  var poemarr = []
  var poems = ""
  
  for(let i = 0; i < 10; i++) {

    //s += thismem.memory + " -- " + thismem.book_id + "(" + data.books[thismem.book_id]['title'] + ", "
    poemarr.push(thismem.memory_from)
    s += thismem.memory_from + ", "
    if(i % 2 == 0) {
      var other_memories_by_same_book = _.filter(data.memories, {book_id:thismem.book_id})
      thismem = _.sample(other_memories_by_same_book)
    } else {
      var other_memories_by_same_memory= _.filter(data.memories, {memory:thismem.memory_from})
      thismem = _.sample(other_memories_by_same_memory)
    }
    if(thismem === undefined) {
      s += ";\n"
       thismem = _.sample(data.memories);
    }
    if(poemarr.length == 2) {
      poems += poemgen.tracepoem(poemarr).trim() + "\n"
      poemarr = [];
    }
  }

  console.log(poems);
  window.poems = poems;
//  poems = poems.replace(/[^a-zA-Z0-9]+$/, "X") + ".";
  poems = poems.replace(/--(\s)+$/, "");
  poems = poems.replace(/.(\s)+$/, "");
  poems = poems.replace(/;(\s)+$/, "");
  poems += ".";
  poems = poems.replace(/\n/g, "<br />\n");
  console.log(poems);
  return poems;
//  return s;
}

poemgen.tracery = function(data) {
    poemgen.grammar = tracery.createGrammar(poemgen.grammarSource);
    return poemgen.grammar.flatten("#greeting#");
}


poemgen.tracepoem = function(poemarr) {
  console.log(poemarr);
  var narrator= poemarr[0]
  var subject  = poemarr[1]
  var grammarSource = {
    "memory1": poemarr[0],
    "memory2": poemarr[1],
    "wonderadj": "quiet|solemn|contemplative|still|tender|harmonious".split("|"),
    "tensionadj": "trembling|buzzing|vibrating|swirling".split("|"),
    "adj": "#wonderadj#|#tensionadj#".split("|"),
    "name": "fire|bother|wonder|winter".split("|"),
    "earlylate": "early |late |mid-".split("|"),
    "season": "autumn|summer|fall|winter".split("|"),
    "seasonornot": "|in #earlylate##season#,".split("|"),
    "adverbs": "briskly|tartly|simply|harshly|fuzzily|freely|ably|copiously|furtively|endlessly|sarcastically|generatively|slowly|distinctly".split("|"),
    "adverbornot": "|#adverbs#".split("|"),
    "verbs": "dances|thinks|touches|dreams|hesitates|loves|feels|wanders|does|sits|reads|looks|runs|asks|collapses|chats|donates|instantiates".split("|"),
    "preposition": "around|about|with|of|to|from".split("|"),
    "lineending": ['',',',';','--','.'],
    "thisa": "a|this|that||||one|our|their".split("|"),
    "poemline1": "#thisa# #adj# #memory1# #adverbornot# #verbs# #preposition# #memory2##lineending#",
    "poemline2": "#seasonornot# #memory1# and #memory2# #adverbornot# #verbs##lineending#",
    "poem": "#poemline1#|#poemline2#".split("|")
  }
  return tracery.createGrammar(grammarSource).flatten("#poem#");
}

poemgen.grammarSource = {
  "name": "fire|bother|wonder|winter".split("|"),
  "greeting": "hi #name#, how are you?"
}
poemgen.boo = function() {
  console.log("Fdfsd");
}

poemgen.grammarSource = {
  "name": "fire|bother|wonder|winter".split("|"),
  "greeting": "hi #name#, how are you?"
}
