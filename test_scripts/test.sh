for test in $(ls -B test_files); do 
	echo "Processing $test.";
	baseFile=${test%.pinfile};
	node pin_parsing.js test_files/$test generated_outputs/${baseFile}.csv
	echo "Comparing generated output of $test to correct output.";
	diff -u correct_outputs/${baseFile}.csv generated_outputs/${baseFile}.csv > diffs/${baseFile}.patch ;
	echo "Replacing pin names.";
	node replacer.js < generated_outputs/${baseFile}.csv > final_generated_outputs/${baseFile}.txt;
done;
