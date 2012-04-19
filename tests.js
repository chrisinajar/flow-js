var assert = require('assert');
var flow = require('./flow');
var keystore = require('./examples/keystore');

var flowsComplete = 0;
setTimeout(function() {
	var expected = 7;
	assert.strictEqual(flowsComplete, expected, flowsComplete + "/" + expected +" flows finished");
	console.log('All tests passed');
}, 1000);

// very simple test
flow.exec(
	function() {
		keystore.increment("counter", 1, this);
	
	},function(err, newValue) {
		assert.strictEqual(newValue, 1, "increment test didn't work");
		flowsComplete += 1;
	}
);

// very simple test with data
flow.exec(
	function() {
		this.blah = 'val1';
		keystore.increment("counter", 1, this);
	},function(err, newValue) {
		assert.strictEqual(newValue, 2, "increment test didn't work");
		assert.strictEqual(this.blah, 'val1', "data did not persist");
		
		keystore.increment("counter", 1, this);
	},function(err, newValue) {
		assert.strictEqual(newValue, 3, "increment test didn't work");
		assert.strictEqual(this.blah, 'val1', "data did not persist");
		flowsComplete += 1;
	}
);

// MULTI test
flow.exec(
	function() {
		keystore.set("firstName", "Bob", this.MULTI());
		keystore.set("lastName", "Vance", this.MULTI());
	
	},function() {
		var db = keystore.getDb();
		assert.strictEqual(db.firstName, "Bob", "multi test didn't work");
		assert.strictEqual(db.lastName, "Vance", "multi test didn't work");
		flowsComplete += 1;
	
	}
);

// MULTI with result identifier test
flow.exec(
  function() {
    var db = keystore.getDb();
    db['firstName'] = "Bob"
    db['lastName'] = "Vance"
    keystore.get("firstName", this.MULTI('first-name'));
    keystore.get("lastName", this.MULTI('last-name'));
  },function(results) {
    assert.strictEqual(results['first-name'][1], "Bob", "multi with result identifier test didn't work");
    assert.strictEqual(results['last-name'][1], "Vance", "multi with result identifier test didn't work");
    flowsComplete += 1;
  }
);

// MULTI checking if returning all multi's before the parent function returns
flow.exec(
  function() {
    var db = keystore.getDb();
    db['bob'] = "Bob Vance";
	this.MULTI('triumph')('success');
	this.MULTI('triumph2')('alsoSuccess');
    keystore.exists("bob", this.MULTI('bob-exists'));
    keystore.exists("john", this.MULTI('john-exists'));
  },function(results) {
    assert.strictEqual(results['triumph'], 'success', "multi returning syncronously did not pass the correct value.");
    assert.strictEqual(results['triumph2'], 'alsoSuccess', "multi returning syncronously did not pass the correct value.");
    assert.strictEqual(results['bob-exists'], true, "multi returning first value before others test didn't work");
    assert.strictEqual(results['john-exists'], false, "multi returning first value before others test didn't work");
    flowsComplete += 1;
  }
);

// MULTI with result identifier for single return value test
flow.exec(
  function() {
    var db = keystore.getDb();
    db['bob'] = "Bob Vance"
    keystore.exists("bob", this.MULTI('bob-exists'));
    keystore.exists("john", this.MULTI('john-exists'));
  },function(results) {
    assert.strictEqual(results['bob-exists'], true, "multi with result identifier for single return value test didn't work");
    assert.strictEqual(results['john-exists'], false, "multi with result identifier for single return value test didn't work");
    flowsComplete += 1;
  }
);

// serialForEach test
var valueSequence = [];
flow.serialForEach([1, 2, 3, 4], function(val) {
	keystore.increment("forEachCounter", val, this);
},function(error, newVal) {
	if (error) throw error;
	valueSequence.push(newVal);
},function() {
	assert.deepEqual(valueSequence, [1, 3, 6, 10], "sequence of values is incorrect: " + JSON.stringify(valueSequence));
	flowsComplete += 1;
});
