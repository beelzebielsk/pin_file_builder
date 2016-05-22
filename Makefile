docDir = fancyDocumentation
styleSheet = $(docDir)/report.css
phantom = /usr/bin/phantomjs


doc : README.md
	markdown-pdf --out $(docDir)/$(basename $^).pdf --css-path $(styleSheet) \
		--phantom-path $(phantom) \
		$^

