function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};
function guid() {
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

var Store = Backbone.LocalStorage = function(name) {
    this.name = name;
    var store = localStorage.getItem(this.name);
    this.records = (store && store.split(",")) || [];
};

_.extend(Backbone.LocalStorage.prototype, {
    
    save: function () {
      this.localStorage().setItem(this.name, this.records.join(","));
    },

    create: function (model) {
      if (!model.id) {
        model.id = guid();
        model.set(model.idAttribute, model.id);
        model.set(model.idAttribute, model.id);
      }
    this.localStorage().setItem(this.name+"-"+model.id, JSON.stringify(model));
    this.records.push(model.id.toString());
    this.save();
    return this.find(model);
    },

  destroy: function(model) {
    if (model.isNew())
      return false
    this.localStorage().removeItem(this.name+"-"+model.id);
    this.records = _.reject(this.records, function(id){
      return id === model.id.toString();
    });
    this.save();
    return model;
  },

  localStorage: function() {
    return localStorage;
  },

  jsonData: function (data) {
      return data && JSON.parse(data);
  },

  find: function(model) {
    return this.jsonData(this.localStorage().getItem(this.name+"-"+model.id));
  },

  findAll: function() {
    var collection = _(this.records).chain()
      .map(function(id){
        return this.jsonData(this.localStorage().getItem(this.name+"-"+id));
      }, this)
      .compact()
      .value();
    return _.sortBy(collection, function(model){ return model.order; });
  },

  update: function(model) {
    this.localStorage().setItem(this.name+"-"+model.id, JSON.stringify(model));
    if (!_.include(this.records, model.id.toString()))
      this.records.push(model.id.toString()); this.save();
    return this.find(model);
  }
});

Backbone.sync = function(method, model, options) {

  var resp;
  var store = model.localStorage || model.collection.localStorage;

  switch (method) {
    case "read":    resp = model.id ? store.find(model) : store.findAll(); break;
    case "create":  resp = store.create(model);                            break;
    case "update":  resp = store.update(model);                            break;
    case "delete":  resp = store.destroy(model);                           break;
  }

  if (resp) {
    options.success(resp);
  } else {
    options.error("Record not found");
  }
};