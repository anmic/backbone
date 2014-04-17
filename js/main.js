var template = function (id) {
    return _.template($("#" + id).html() );
};

var Todo = Backbone.Model.extend({
    defaults: function() {
        return {
            title: "New Todo",
            done: false,
            order: todos.nextOrder(),
            createTime: $.format.date(new Date(), 'dd MMM yy, HH:mm')
        };
    },
    toggle: function() {
        this.save("done", !this.get("done") );
    }
});

var TodoView = Backbone.View.extend({
    tagName: "li",
    className: "todoView",
    events: {
        "click .upButton" : "up",
        "click .downButton" : "down",
        "click .toggle" : "toggle",
        "click .destroyButton" : "destroy",
        "dblclick .titleLabel": "edit",
        "click .editButton" : "edit",
        "blur .edit": "close",
        "keypress .edit"  : "updateOnEnter",

    },
    initialize: function () {
        this.tasks = $(".tasks");
        this.template = template("taskTemplate");
        this.model.on("change:order", this.sort, this);
        this.model.on("destroy", this.remove, this);
        this.model.on("change", this.render, this);
        this.render();
    },
    render: function  () {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
    up: function () {
        vent.trigger("todo:change:orderUp", this.model);
    },
    down: function () {
        vent.trigger("todo:change:orderDown", this.model);
    },
    toggle: function () {
        this.model.toggle();
    },
    remove: function () {
        this.el.remove();
    },
    edit: function () {
        this.$el.addClass("editing");
        this.$(".edit").focus();
    },
    destroy: function () {
        todos.destroy(this.model);
    },
    close: function () {
        var newTitle = this.$(".edit").val();
        if (!newTitle) {
            this.model.destroy();
        };
        this.model.save({title: newTitle});
        this.$el.removeClass("editing");
    },
    updateOnEnter: function  (e) {
        if (e.keyCode == 13) this.close();
    },
    sort: function () {
        vent.trigger("todo:change:order");
    }
});

var Todos = Backbone.Collection.extend({
    model: Todo,
    localStorage: new Store("todos-backbone"),
    done: function () {
        return this.where({done: true});
    },
    remaining: function () {
        return this.where({done: false});
    },
    nextOrder: function () {
        return this.length;
    },
    comparator: function (task) {
        return task.get("order");
    },
    destroy: function (model) {
        var thisElement = model.get("order");
        var lastElement = todos.length;
        for (var i = thisElement; i <= lastElement -1; i++) {
            todos.at(i).save("order", i - 1);
        }
        model.destroy();
    }
});

var AppView = Backbone.View.extend({
    el: "#tasksBoard",
    events: {
        "click #addTask": "addTask",
        "click #removeDone" : "removeDone",
        "keypress #newTask" : "updateOnEnter"

    },
    initialize: function () {
        this.footerTemplate = template("footerTemplate");
        this.tasks = $(".tasks");
        var done = this.collection.done().length;
        var remaining = this.collection.remaining().length;
        this.footer = $("footer");
        this.listenTo(this.collection, 'all', this.render);
        this.listenTo(this.collection, "add", this.onCollectionAdd);
        this.render();
        this.collection.fetch();
        vent.on("todo:change:orderUp", this.up);
        vent.on("todo:change:orderDown", this.down);
    },
    render: function () {
        var done = this.collection.done().length;
        var remaining = this.collection.remaining().length;
        this.footer.html(this.footerTemplate({done: done, remaining: remaining}));
        return this;
    },
    addTask: function () {
        var newTask = $("#newTask").val();
        if (newTask) {
            var todo = new Todo({title : newTask});
            this.collection.create(todo);
            $("#newTask").val('');
        }
    },
    removeDone: function () {
        _.map(this.collection.done(), function(task){todos.destroy(task)});
    },
    onCollectionAdd: function (task) {
        var view = new TodoView({model: task});
        view.render()
        this.tasks.append(view.el);
    },
    updateOnEnter: function  (e) {
        var enterKeyCode = 13;
        if (e.keyCode == enterKeyCode) this.addTask();
    },
    sortTodos: function () {
        alert("!");
    },
    up: function (model) {
        var thisElementOrder = model.get("order"); 
        if (thisElementOrder != 0) {
            var view = new TodoView({model: model});
            $("li:eq(" + (thisElementOrder) + ")").remove();
            $("li:eq(" + (thisElementOrder-1) + ")").before(view.render().el);
            todos.at(thisElementOrder-1).save("order", thisElementOrder);
            model.save("order", thisElementOrder-1);
            todos.sort();
        }
    },
    down: function (model) {
        var thisElementOrder = model.get("order");; 
        if (thisElementOrder != todos.length-1) {
            var view = new TodoView({model: model});
            view.render()
            $("li:eq(" + (thisElementOrder) + ")").remove();
            $("li:eq(" + (thisElementOrder) + ")").after(view.el);
            todos.at(thisElementOrder+1).save("order", thisElementOrder);
            model.save("order", thisElementOrder+1);
            todos.sort();
        }
    }
});

vent = _.extend({}, Backbone.Events);

var todos = new Todos();

var appView = new AppView({collection: todos});

var todostore = [
    {title: "task0!"},
    {title: "task1"},
    {title: "task2"},
    {title: "task3", done: true}
];