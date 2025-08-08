nninc#!/bin/bash

# 显示提示
echo "请输入本次提交的更新说明："
read commit_msg

# Git 操作
git add .
git commit -m "$commit_msg"
git push

