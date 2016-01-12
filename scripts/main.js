(function(){

	console.log('Drafts Online');

	// Only fire up stuff when in editor
	$('.js-add-post-button').click(function(){

		//Initialize TODO: Make this automated, fetch stuff from array
		if(localStorage.getItem('drafts-count') == null){
			localStorage.setItem('drafts-count',0);
		}

		if(localStorage.getItem('drafts-settings') == null){
			var defaultSettings = {
				autosave: false //Autosave state
			}
			localStorage.setItem('drafts-settings',JSON.stringify(defaultSettings));
		}

		if(localStorage.getItem('drafts-autosave') == null){
			localStorage.setItem('drafts-autosave',JSON.stringify({"content":''}));
		}

		//Display drafts button, after a delay for DOM to build
		setTimeout(function(){
			addDrafts();
		}, 500);	

		//Get and parse settings
		var settings = JSON.parse(localStorage.getItem('drafts-settings'));

		//Autosave feature
		setInterval(function(){
			if(settings.autosave){
				autosaveDraft();
			}
		}, 120000);

		//Add Draft button to Editor
		var addDrafts = function(){

			//Append editor button and Drafts-list box to toolbar
			var element = $('ul.redactor_toolbar');

			//Add Drafts-list
			element.append('<div class="redactor_dropdown redactor_dropdown_box_drafts" style="position: absolute; left: 263px; top: 30px; display:none;"></div>');
			//Add drafts-button
			element.append('<li><a href="javascript:;" style="background-position-x: -600px;" title="Черновики" class="redactor_btn redactor_btn_drafts" tabindex="-1"></a></li>');

			$('.redactor_dropdown_box_drafts').data('active', 'false');

			//Show/hide Drafts list, can't use native scripts of editor :(
			$('.redactor_btn_drafts').click(function(){
				var dropdown = $('.redactor_dropdown_box_drafts');
				if(dropdown.data('active') == 'false'){
					//Populate Drafts-list
					populateDrafts();

					dropdown.data('active', 'true').css('display','block');
					$(this).addClass('redactor_act dropact');
				}else{
					dropdown.data('active', 'false').css('display','none');
					$(this).removeClass('redactor_act dropact');
				}
			});

			//If clicked in editor - hide Drafts
			$('.redactor_post-editor-textarea').click(function(){
				var dropdown = $('.redactor_dropdown_box_drafts');
				if(dropdown.data('active') == 'true'){
					dropdown.data('active', 'false').css('display','none');
					$('.redactor_btn_drafts').removeClass('redactor_act dropact');
				}
			});

		}

		//Append list of drafts to drafts box
		var populateDrafts = function(){
			//Clear current list before fetching new one
			$('.redactor_dropdown_box_drafts').html('');

			var finalData = '';
			var draftsCount = parseInt(localStorage.getItem('drafts-count'));
			var draftsArr = [];

			//Add drafts-save button
			finalData += '</a><a href="#" class="save-draft">Сохранить черновик</a>';

			//Add autosave button
			finalData += '</a><a href="#" class="autosave-draft">'+(settings.autosave ? 'Выключить' : 'Включить')+' автосейв</a>';		

			if(draftsCount > 0 && draftsCount != null){
				//Check if drafts initialized and have drafts

				for(i=0; i< draftsCount; i++){
					var currId = 'draft-'+(i+1);
					finalData += '<a href="#" tabindex="-1" class="push-draft" data-draftId='+currId+'>';
					finalData += JSON.parse(localStorage.getItem(currId)).date;
					finalData += '</a><a href="#" class="delete-draft" data-draftId='+currId+'>[x]</a>';
					finalData += '<div class="clear"></div>';
				}

				finalData += '<a href="#" tabindex="-1" class="push-autosaved">Загрузить автосейв</a>';

			}else{
				finalData += '<a href="#" tabindex="-1">Черновиков нет</a>';
				finalData += '<a href="#" tabindex="-1" class="push-autosaved">Загрузить автосейв</a>';
			}

			//Append drafts to drafts-list and bind clicks
			$('.redactor_dropdown_box_drafts').append(finalData);
			bindDrafts();
		}

		//Bind drafts-list actions
		var bindDrafts = function(){
			$('a.push-draft').click(function(){
				var draftId = $(this).data('draftid');
				pushDraft(draftId);
			});

			$('a.delete-draft').click(function(){
				var draftId = $(this).data('draftid');
				deleteDraft(draftId);
			});

			$('a.save-draft').click(function(){
				saveDraft();
			});

			$('a.autosave-draft').click(function(){
				autosaveDraftSwitch();
			});

			$('a.push-autosaved').click(function(){
				pushDraft('drafts-autosave');
			})
		}

		//Push draft onto the page
		var pushDraft = function(draftId){
			//Get draft content
			var draftContent = JSON.parse(localStorage.getItem(draftId)).content;

			//Flush current content, FOR SCIENCE!
			$('.redactor_post-editor-textarea').html('');

			//Hide drafts list
			$('.redactor_dropdown_box_drafts').data('active', 'false').css('display','none');
			$('.redactor_btn_drafts').removeClass('redactor_act dropact');

			//Show draft
			$('.redactor_post-editor-textarea').html(draftContent);
		}

		//Delete draft from the storage
		var deleteDraft = function(draftId){
			//Remove from storage
			localStorage.removeItem(draftId);

			//Lower draft-count
			var newCount = parseInt(localStorage.getItem('drafts-count')-1);
			if (newCount < 0) {newCount = 0};
			localStorage.setItem('drafts-count',newCount);

			//Reindex
			for(i=(parseInt(draftId.split('-')[1]));i<=(newCount+1);i++){
				localStorage.setItem('draft-'+i,localStorage.getItem('draft-'+(i+1)));
			}
			localStorage.removeItem('draft-'+(newCount+1));

			//Populate drafts
			populateDrafts();

		}

		//Save draft to storage
		var saveDraft = function(){
			//Get current draft count
			var currCount = parseInt(localStorage.getItem('drafts-count'));
			currCount+=1;

			//Get current editor content and Stringify
			var content = $('.redactor_post-editor-textarea').html();

			//Get current date and time
			var date = new Date();
			var day = date.getDate();
			var month = ((date.getMonth()+1) < 10 ? '0'+(date.getMonth()+1) : (date.getMonth()+1));
			var hour = date.getHours();
			var minute = (date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes());
			var finalDate = day+'.'+month+' '+hour+':'+minute;

			//Compile to final object
			var finalData = {date: finalDate, content: content};

			//Save to storage and increase count
			localStorage.setItem('draft-'+currCount,JSON.stringify(finalData));
			localStorage.setItem('drafts-count', currCount);

			populateDrafts();
		}

		//Autosave draft setting switch
		var autosaveDraftSwitch = function(){
			settings.autosave ? settings.autosave = false : settings.autosave = true;
			
			//Save to storage
			localStorage.setItem('drafts-settings',JSON.stringify(settings));

			//Rebuild list
			populateDrafts();
		}

		//Autosave current stuff into special slot
		var autosaveDraft = function(){
			//Get current editor content and Stringify
			var content = $('.redactor_post-editor-textarea').html();

			//Save to storage and increase count
			localStorage.setItem('drafts-autosave',JSON.stringify({"content":content}));

		}

	})

})();