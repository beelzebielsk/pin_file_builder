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


doc : specification.md
	pandoc -o $(docDir)/$(basename $<).pdf $< --latex-engine=$(basicEngine) $(variables)

fancyDoc : specification.md
	pandoc -o $(docDir)/$(basename $<).pdf $< --latex-engine=$(fancyEngine) $(variables) $(fancyVariables)

pegParser : pegjs_parser.pegjs
	pegjs $< peg_parsing.js
