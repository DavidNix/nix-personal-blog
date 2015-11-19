.PHONY: deploy clean

default: deploy

deploy: clean
	hugo
	git add -A
	git commit -m "RELEASE `date`"
	# git push origin develop
	# git subtree push --prefix=public origin master	

clean:
	rm -rf ./public/*
