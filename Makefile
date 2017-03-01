docDir = fancyDocumentation
values = \
				 geometry='margin=1in' \
				 linkcolor='black' \
				 urlcolor='Mulberry'
fancyValues = \
				 mainfont='heuristica' \
				 #monofont='SourceCodePro'
variables = $(addprefix -V, $(values))
fancyVariables = $(addprefix -V, $(fancyValues))
basicEngine = pdflatex
fancyEngine = lualatex
testFilesDir = $(realpath ./test_files/)
labsDir = ~/homework/csc342-343

finalFiles := 


doc : specification.md
	pandoc -o $(docDir)/$(basename $<).pdf $< --latex-engine=$(basicEngine) $(variables)

fancyDoc : specification.md
	pandoc -o $(docDir)/$(basename $<).pdf $< --latex-engine=$(fancyEngine) $(variables) $(fancyVariables)

pegParser : pegjs_parser.pegjs
	pegjs $< peg_parsing.js

#$(foreach lab, $(wildcard lab*), cp -Ru $(lab)/project/pin_assignments -t $(testFilesDir) )
#@$(foreach lab, $(wildcard $(labsDir)/lab*), if [-d $(lab)] then echo $(lab); fi \) 
.PHONY : fetchPinFiles
fetchPinFiles :
	for lab in $$(echo $(labsDir)/lab*); do \
		if [ -d $$lab ] \
			then \
				echo $$lab; \
		fi; \
	done;

# make the final branch
# Set a finalFiles variable.
# Checkout the final branch.
# Remove everything in the branch, then have it checkout all of the files from `finalFiles`.

#.PHONY : finalBranch
#finalBranch
