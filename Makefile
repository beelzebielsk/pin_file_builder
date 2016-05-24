docDir = fancyDocumentation
styleSheet = $(docDir)/report.css
phantom = /usr/bin/phantomjs
values = geometry='margin=1in' mainfont='heuristica' monofont='SourceCodePro' linkcolor='green' urlcolor='Mulberry'
#values = geometry='margin=1in' mainfont='heuristica'
variables = $(addprefix -V, $(values) )
engine = pdflatex


doc : README.md
	pandoc -o $(docDir)/$(basename $<).pdf $< --latex-engine=$(engine) $(variables)

