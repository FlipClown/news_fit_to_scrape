$(document).ready(function () {
    
    var articleContainer = $(".article-container");
  
    $(document).on("click", ".btn.delete", handleArticleDelete);
    $(document).on("click", ".btn.notes", handleArticleNotes);
    $(document).on("click", ".btn.save", handleNoteSave);
    $(document).on("click", ".btn.note-delete", handleNoteDelete);

   
    initPage();

    function initPage() {
        
        articleContainer.empty();
        $.get("/api/headlines?saved=true").then(function (data) {
        
            if (data && data.length) {
                renderArticles(data);
            }
            else {
                
                renderEmpty();
            }
        });
    }

    function renderArticles(articles) {
        
        var articlePanels = [];
        
        for (var i = 0; i < articles.length; i++) {
            articlePanels.push(createPanel(articles[i]));
        }
        
        articleContainer.append(articlePanels);
    }

    function createPanel(article) {
        
        var panel = $(
            [
                "<div class='panel panel-default'>",
                "<div class='panel-heading'>",
                "<h3>",
                "<a class='article-link' target='_blank' href='" + article.url + "'>",
                article.headline,
                "</a>",
                "<a class='btn btn-danger delete'>",
                "Delete From Saved",
                "</a>",
                "<a class='btn btn-info notes'>Article Notes</a>",
                "</h3>",
                "</div>",
                "<div class='panel-body'>",
                article.summary,
                "</div>",
                "</div>"
            ].join("")
        );
        
        panel.data("_id", article._id);
        
        return panel;
    }

    function renderEmpty() {
        
        var emptyAlert = $(
            [
                "<div class='alert alert-warning text-center'>",
                "<h4>Uh Oh. Looks like we don't have any saved articles.</h4>",
                "</div>",
                "<div class='panel panel-default'>",
                "<div class='panel-heading text-center'>",
                "<h3>Would You Like to Browse Available Articles?</h3>",
                "</div>",
                "<div class='panel-body text-center'>",
                "<h4><a href='/'>Browse Articles</a></h4>",
                "</div>",
                "</div>"
            ].join("")
        );
   
        articleContainer.append(emptyAlert);
    }

    function renderNotesList(data) {
       
        var notesToRender = [];
        var currentNote;
        if (!data.notes.length) {
          
            currentNote = ["<li class='list-group-item'>", "No notes for this article yet.", "</li>"].join("");
            notesToRender.push(currentNote);
        }
        else {
            
            for (var i = 0; i < data.notes.length; i++) {
                
                currentNote = $(
                    [
                        "<li class='list-group-item note'>",
                        data.notes[i].noteText,
                        "<button class='btn btn-danger note-delete'>x</button>",
                        "</li>"
                    ].join("")
                );
                
                currentNote.children("button").data("_id", data.notes[i]._id);
               
                notesToRender.push(currentNote);
            }
        }
        
        $(".note-container").append(notesToRender);
    }

    function handleArticleDelete() {
        
        var articleToDelete = $(this).parents(".panel").data();
        
        $.ajax({
            method: "DELETE",
            url: "/api/headlines/" + articleToDelete._id
        }).then(function (data) {
            
            if (data.ok) {
                initPage();
            }
        });
    }

    function handleArticleNotes() {
        // This function handles opending the notes modal and displaying our notes
        // We grab the id of the article to get notes for from the panel element the delete button sits inside
        var currentArticle = $(this).parents(".panel").data();
        // Grab any notes with this headline/article id
        $.get("/api/notes/" + currentArticle._id).then(function (data) {
            // Constructing our initial HTML to add to the notes modal
            var modalText = [
                "<div class='container-fluid text-center'>",
                "<h4>Notes For Article: ",
                currentArticle._id,
                "</h4>",
                "<hr />",
                "<ul class='list-group note-container'>",
                "</ul>",
                "<textarea placeholder='New Note' rows='4' cols='60'></textarea>",
                "<button class='btn btn-success save'>Save Note</button>",
                "</div>"
            ].join("");
            // Adding the formatted HTML to the note modal
            bootbox.dialog({
                message: modalText,
                closeButton: true
            });
            var noteData = {
                _id: currentArticle._id,
                notes: data || []
            };
            // Adding some information about the article and article notes to the save button for easy access
            // When trying to add a new note
            $(".btn.save").data("article", noteData);
            // renderNotesList will populate the actual note HTML inside of the modal we just created/opened
            renderNotesList(noteData);
        });
    }

    function handleNoteSave() {
        // This function handles what happens when a user tries to save a new note for an article
        // Setting a variable to hold some formatted data about our note,
        // grabbing the note typed into the input box
        var noteData;
        var newNote = $(".bootbox-body textarea").val().trim();
        // If we actually have data typed into the note input field, format it
        // and post it to the "/api/notes" route and send the formatted noteData as well
        if (newNote) {
            noteData = {
                _id: $(this).data("article")._id,
                noteText: newNote
            };
            $.post("/api/notes", noteData).then(function () {
                // When complete, close the modal
                bootbox.hideAll();
            });
        }
    }

    function handleNoteDelete() {
        // This function handles the deletion of notes
        // First we grab the id of the note we want to delete
        // We stored this data on the delete button when we created it
        var noteToDelete = $(this).data("_id");
        // Perform an DELETE request to "/api/notes/" with the id of the note we're deleting as a parameter
        $.ajax({
            url: "/api/notes/" + noteToDelete,
            method: "DELETE"
        }).then(function () {
            // When done, hide the modal
            bootbox.hideAll();
        });
    }
});