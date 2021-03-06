// helam 1 January 2017 at 17:54

// Tutorial for defining custom properties using Object.defineProperty
// This has MANY uses but these specific examples will show how to make a
// '.sources' property for rooms so you can just do room.sources instead of
// room.find(FIND_SOURCES); The tutorial contains 4 different ways to define
// the same property, each one adds on to the previous one to make it a little
// bit better and show you different options you have when defining your own
// custom properties. Each version has its own benefits and draw backs so its up
// to you to choose the best one for your situation. Note that you will only want
// one of these for each property.

// You will pass 3 arguments to Object.defineProperty:
//  Argument 1: The prototype you want to add the property to.
//      We will use Room.prototype for this example but you can use
//      any prototype (Creep.prototype, StructureSpawn.prototype, etc.)
//  Argument 2: the name of the property you want to define, in a string.
//      We are using 'sources' for this example but it can be 'foo', 'myProp', etc.
//  Argument 3: An object containing options that set up the property.
//      See below examples.

// AUTHOR: Helam

// VERSION 1 - basic property with getter only and no caching
Object.defineProperty(Room.prototype, 'sources', {
    // This is the getter function, when you type room.sources it will
    // have the value returned by this function
    get: function() {
		// this if statement is to prevent an obscure bug that can be caused by the screeps profiler.
		// its not necessary normally.
		if(this === Room.prototype || this == undefined)
        	return;
        // since we are defining the property on the Room prototype,
        // 'this' in the line below whatever room object we are getting
        // the .sources from
        return this.find(FIND_SOURCES);
    },
    // this makes it so the property doesn't show up when enumerating the properties of the creep
    enumerable: false,
    // this makes the characteristics of the property modifiable and also makes the property deletable
    configurable: true
});

// VERSION 2
// this version stores the value of the property locally on the object so
// that if you get the property from the object more than once in the same tick
// it will return the stored value instead of finding the value again.
Object.defineProperty(Room.prototype, 'sources', {
    get: function() {
		if(this === Room.prototype || this == undefined)
        	return;
        // this._sources will have no value the first time this is called,
        // so it will find the value and store it there so the next time
        // you get the property in the same tick it will return the stored
        // value. The reason we use ._sources instead of .sources here is
        // because if we try to access .sources in here it will call the
        // getter function again and cause an infinite loop! putting a '_'
        // in front of a variable name is just a naming style that means
        // the variable isnt meant to be accessed by outside functions.
        // this is also sometimes called a 'private' variable.
        if (!this._sources) {
            this._sources = this.find(FIND_SOURCES);
        }
        return this._sources;
    },
    enumerable: false,
    configurable: true
});

// VERSION 3
// This version adds a setter function. If you want to be able to assign your custom
// property a value then you must add a setter, otherwise you will get an error when
// assigning a value. In this particular case you would not set room.sources to anything
// because the getter value does the setting for you but I will show how to do the setter
// anyway.
Object.defineProperty(Room.prototype, 'sources', {
    get: function() {
		if(this === Room.prototype || this == undefined)
        	return;
        if (!this._sources) {
            this._sources = this.find(FIND_SOURCES);
        }
        return this._sources;
    },
    set: function(value) {
        // we set the stored private variable so
        // the next time the getter is called it returns
        // this new value
        this._sources = value;
    },
    enumerable: false,
    configurable: true
});

// VERSION 4
// This version shows how to add memory caching to the property.
// Caching the value in memory does not make sense in certain situations
// but I recommend this version for this particular example as it will
// make it so you only every do room.find(FIND_SOURCES) once per room and
// NEVER need to call it again unless the memory value gets deleted. You
// can do this in this situation because the sources in a room never change.
Object.defineProperty(Room.prototype, 'sources', {
    get: function() {
		if(this === Room.prototype || this == undefined)
        	return;
        // if we dont have the value stored in the private variable
        if (!this._sources) {
            // try to get it from memory
            // if its not in memory, find it and store it in memory
            // only storing the id's. best to avoid storing full objects
            // in memory. See the screeps documentation page
            // called 'Working with Memory' to find out why.
            if (!this.memory.sourceIds) {
                this.memory.sourceIds = this.find(FIND_SOURCES).map(source => source.id);
            }
            this._sources = this.memory.sourceIds.map(id => Game.getObjectById(id));
        }
        return this._sources;
    },
    set: function(value) {
        // when storing in memory you will want to change the setter
        // to set the memory value as well as the local value
        this.memory.sources = value.map(source => source.id);
        this._sources = value;
    },
    enumerable: false,
    configurable: true
});


// OTHER TOY EXAMPLES

// .isFull property to tell if creep's carry parts are full
Object.defineProperty(Creep.prototype, 'isFull', {
   get: function() {
       if (!this._isFull) {
           this._isFull = _.sum(this.carry) === this.carryCapacity;
       }
       return this._isFull;
   },
    enumerable: false,
    configurable: true
});

// A little more advanced, adds a .memory property to all sources.
// there is an example of adding memory to structures pinned to the
// help channel as well. I didnt write this function, i belive it was
// written by artem, one of the developers of screeps. I just modified it
// a little for my purposes.
Object.defineProperty(Source.prototype, 'memory', {
    configurable: true,
    get: function() {
        if(_.isUndefined(Memory.mySourcesMemory)) {
            Memory.mySourcesMemory = {};
        }
        if(!_.isObject(Memory.mySourcesMemory)) {
            return undefined;
        }
        return Memory.mySourcesMemory[this.id] = Memory.mySourcesMemory[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.mySourcesMemory)) {
            Memory.mySourcesMemory = {};
        }
        if(!_.isObject(Memory.mySourcesMemory)) {
            throw new Error('Could not set source memory');
        }
        Memory.mySourcesMemory[this.id] = value;
    }
});

// Adds a .freeSpaceCount property to sources that returns a number
// telling you how many spots are around the source that are not natural
// walls. THIS PARTICULAR IMPLEMENTATION DEPENDS ON ADDING .memory TO SOURCES
// USING THE PREVIOUS EXAMPLE.
Object.defineProperty(Source.prototype, 'freeSpaceCount', {
    get: function () {
        if (this._freeSpaceCount == undefined) {
            if (this.memory.freeSpaceCount == undefined) {
                var freeSpaceCount = 0;
                [this.pos.x - 1, this.pos.x, this.pos.x + 1].forEach(x => {
                    [this.pos.y - 1, this.pos.y, this.pos.y + 1].forEach(y => {
                        if (Game.map.getTerrainAt(x, y, this.pos.roomName) != 'wall')
                            freeSpaceCount++;
                    }, this);
                }, this);
                this.memory.freeSpaceCount = freeSpaceCount;
            }
            this._freeSpaceCount = this.memory.freeSpaceCount;
        }
        return this._freeSpaceCount;
    },
    enumerable: false,
    configurable: true
});