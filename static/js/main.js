var apiUrl = 'http://fests.herokuapp.com/api/v1/';
var Events = null, Pages = null, Sections = null, sView = null;

function slugify(text) {
    text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
    text = text.replace(/\s/gi, "-");
    return text;
}

function updateSections(slug, collection) {
    if (Sections === null) {
        Sections = new SectionsCollection();
    }
    if (sView === null) {
        sView = new SectionsView({'collection': Sections});
    }
    model = _.find(collection.models, function(model) {return model.get('slug') === slug;})
    Sections.reset(model.get('sections'));
    $('#content-tabs a:first').tab('show');
}

$(function() {
    window.Event = Backbone.Model.extend();
    window.Page = Backbone.Model.extend();
    window.Section = Backbone.Model.extend();
    
    window.EventsCollection = Backbone.Collection.extend({
        model: Event,
        url: apiUrl + 'event/',
        parse: function(response) {
            return response.objects;
        }
    });
    window.PagesCollection = Backbone.Collection.extend({
        model: Page,
        url: apiUrl + 'page/',
        parse: function(response) {
            return response.objects;
        }
    });
    window.SectionsCollection = Backbone.Collection.extend({
        model: Section
    });
    
    window.TabsView = Backbone.View.extend({
        tagName: 'li',
        template: '<a href="#<%= slugify(label) %>" data-toggle="tab"><%= label %></a>',
        render: function() {
            $(this.el).html(_.template(this.template, this.model.toJSON()));
            return this;
        }
    });
    window.ContentsView = Backbone.View.extend({
        tagName: 'div',
        className: 'tab-pane',
        template: '<%= content %>',
        
        render: function() {
            $(this.el).html(_.template(this.template, this.model.toJSON()));
            return this;
        }
    });
    window.SectionsView = Backbone.View.extend({
        initialize: function() {
            this.collection.bind('reset', this.render, this);
        },
        render: function() {
            $("#content-tabs-data").html('');
            $("#content-tabs").html('');
            _.each(this.collection.models, function(model) {
                cV = new ContentsView({ 'model': model, 'id': slugify(model.get('label')) });
                tV = new TabsView({ 'model': model });
                $("#content-tabs-data").append(cV.render().el);
                $("#content-tabs").append(tV.render().el);
            });
        }
    });
    
    window.AppRouter = Backbone.Router.extend({
        routes: {
            '': 'start',
            'events/:slug/': 'events',
            'pages/:slug/': 'pages'
        },
        
        'start': function() {
            this.navigate('/#pages/home/', true);
        },
        'events': function(slug) {
            if (Events === null) {
                Events = new EventsCollection();
            }
            if (!_.find(Events.models, function(model) {return model.get('slug') === slug;})) {
                Events.fetch({
                    add: true,
                    dataType: 'jsonp',
                    data: {
                        'slug': slug
                    },
                    success: function(data) {
                        updateSections(slug, Events);
                    }
                });
            }
            else {
                updateSections(slug, Events);
            }
        },
        'pages': function(slug) {
            if (Pages === null) {
                Pages = new PagesCollection();
            }
            if (!_.find(Pages.models, function(model) {return model.get('slug') === slug;})) {
                Pages.fetch({
                    add: true,
                    dataType: 'jsonp',
                    data: {
                        'slug': slug
                    },
                    success: function(data) {
                        updateSections(slug, Pages);
                    }
                });
            }
            else {
                updateSections(slug, Pages);
            }
        }
    });
    
    var app = new AppRouter();
    Backbone.history.start();
});
