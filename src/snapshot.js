
//okay so have a snapshot, + memtable.
//then db which takes a snapshot + a memtable & has an update snapshot function.
//a snapshot is a list of ssts.

//and a compact operation, which creates a new memtable, and then treats the previous one
//as an sst... INFACT why not just compact all the SSTs together?
